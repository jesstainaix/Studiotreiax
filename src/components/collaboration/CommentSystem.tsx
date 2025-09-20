import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Reply, AtSign, Paperclip, Check, X, MoreHorizontal, Edit3, Trash2, Image, File } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { realtimeService } from '../../services/realtimeService';

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  elementId?: string;
  timelinePosition?: number;
  parentId?: string; // Para threads
  mentions: string[];
  attachments: CommentAttachment[];
  resolved: boolean;
  reactions: CommentReaction[];
  edited: boolean;
  editedAt?: Date;
}

interface CommentAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'screenshot';
  url: string;
  size: number;
  thumbnail?: string;
}

interface CommentReaction {
  emoji: string;
  userId: string;
  username: string;
}

interface CommentThread {
  id: string;
  rootComment: Comment;
  replies: Comment[];
  participants: string[];
  lastActivity: Date;
  resolved: boolean;
}

interface CommentSystemProps {
  timelineRef: React.RefObject<HTMLDivElement>;
  onCommentAdded?: (comment: Comment) => void;
  onCommentResolved?: (commentId: string) => void;
  onMentionUser?: (userId: string) => void;
}

interface CommentMarker {
  commentId: string;
  x: number;
  y: number;
  elementId?: string;
  timelinePosition?: number;
  unread: boolean;
}

export const CommentSystem: React.FC<CommentSystemProps> = ({
  timelineRef,
  onCommentAdded,
  onCommentResolved,
  onMentionUser
}) => {
  const { isConnected, currentUser, collaborators } = useCollaboration();
  const [comments, setComments] = useState<Comment[]>([]);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [markers, setMarkers] = useState<CommentMarker[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [attachments, setAttachments] = useState<CommentAttachment[]>([]);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId?: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'mentions' | 'mine'>('all');
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Inicializar sistema de comentários
  useEffect(() => {
    if (!isConnected || !currentUser) return;

    // Configurar listeners para comentários em tempo real
    realtimeService.on('comment:added', handleCommentAdded);
    realtimeService.on('comment:updated', handleCommentUpdated);
    realtimeService.on('comment:deleted', handleCommentDeleted);
    realtimeService.on('comment:resolved', handleCommentResolved);
    realtimeService.on('comment:reaction', handleCommentReaction);

    // Carregar comentários existentes
    loadExistingComments();

    // Configurar listeners de contexto
    setupContextMenu();

    return () => {
      realtimeService.off('comment:added', handleCommentAdded);
      realtimeService.off('comment:updated', handleCommentUpdated);
      realtimeService.off('comment:deleted', handleCommentDeleted);
      realtimeService.off('comment:resolved', handleCommentResolved);
      realtimeService.off('comment:reaction', handleCommentReaction);
    };
  }, [isConnected, currentUser]);

  // Atualizar threads quando comentários mudarem
  useEffect(() => {
    updateThreads();
    updateMarkers();
  }, [comments]);

  // Configurar menu de contexto
  const setupContextMenu = () => {
    if (!timelineRef.current) return;

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const elementId = getElementAtPosition(x, y);
      
      setContextMenu({ x: e.clientX, y: e.clientY, elementId });
    };

    const handleClick = () => {
      setContextMenu(null);
    };

    timelineRef.current.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('click', handleClick);

    return () => {
      timelineRef.current?.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('click', handleClick);
    };
  };

  // Obter elemento na posição
  const getElementAtPosition = (x: number, y: number): string | undefined => {
    if (!timelineRef.current) return undefined;

    const elements = timelineRef.current.querySelectorAll('[data-element-id]');
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const timelineRect = timelineRef.current.getBoundingClientRect();
      
      const relativeX = x + timelineRect.left;
      const relativeY = y + timelineRect.top;
      
      if (relativeX >= rect.left && relativeX <= rect.right &&
          relativeY >= rect.top && relativeY <= rect.bottom) {
        return element.getAttribute('data-element-id') || undefined;
      }
    }
    return undefined;
  };

  // Carregar comentários existentes
  const loadExistingComments = async () => {
    try {
      // Simular carregamento de comentários (implementar com API real)
      const mockComments: Comment[] = [
        {
          id: 'comment-1',
          userId: 'user-1',
          username: 'João Silva',
          content: 'Este clipe precisa de uma transição mais suave',
          timestamp: new Date(Date.now() - 3600000),
          elementId: 'clip-1',
          timelinePosition: 120,
          mentions: [],
          attachments: [],
          resolved: false,
          reactions: [],
          edited: false
        },
        {
          id: 'comment-2',
          userId: 'user-2',
          username: 'Maria Santos',
          content: '@João Silva Concordo! Que tal usarmos um fade?',
          timestamp: new Date(Date.now() - 1800000),
          parentId: 'comment-1',
          mentions: ['user-1'],
          attachments: [],
          resolved: false,
          reactions: [{ emoji: '👍', userId: 'user-1', username: 'João Silva' }],
          edited: false
        }
      ];
      
      setComments(mockComments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  // Atualizar threads
  const updateThreads = () => {
    const threadMap = new Map<string, CommentThread>();
    
    // Processar comentários raiz
    comments.filter(c => !c.parentId).forEach(rootComment => {
      const replies = comments.filter(c => c.parentId === rootComment.id);
      const participants = [rootComment.userId, ...replies.map(r => r.userId)];
      const lastActivity = replies.length > 0 
        ? new Date(Math.max(...replies.map(r => r.timestamp.getTime())))
        : rootComment.timestamp;
      
      threadMap.set(rootComment.id, {
        id: rootComment.id,
        rootComment,
        replies,
        participants: [...new Set(participants)],
        lastActivity,
        resolved: rootComment.resolved && replies.every(r => r.resolved)
      });
    });
    
    setThreads(Array.from(threadMap.values()));
  };

  // Atualizar marcadores
  const updateMarkers = () => {
    if (!timelineRef.current) return;
    
    const newMarkers: CommentMarker[] = [];
    
    comments.filter(c => !c.parentId && c.elementId).forEach(comment => {
      const element = timelineRef.current?.querySelector(`[data-element-id="${comment.elementId}"]`);
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      const timelineRect = timelineRef.current?.getBoundingClientRect();
      
      if (!timelineRect) return;
      
      newMarkers.push({
        commentId: comment.id,
        x: rect.left - timelineRect.left + rect.width - 10,
        y: rect.top - timelineRect.top - 10,
        elementId: comment.elementId,
        timelinePosition: comment.timelinePosition,
        unread: false // Implementar lógica de não lidos
      });
    });
    
    setMarkers(newMarkers);
  };

  // Handlers de eventos em tempo real
  const handleCommentAdded = (comment: Comment) => {
    setComments(prev => [...prev, comment]);
    onCommentAdded?.(comment);
    
    // Notificar menções
    if (comment.mentions.includes(currentUser?.id || '')) {
      // Mostrar notificação de menção
      showMentionNotification(comment);
    }
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(prev => prev.map(c => 
      c.id === updatedComment.id ? updatedComment : c
    ));
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleCommentResolved = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ));
    onCommentResolved?.(commentId);
  };

  const handleCommentReaction = (data: { commentId: string; reaction: CommentReaction; action: 'add' | 'remove' }) => {
    setComments(prev => prev.map(c => {
      if (c.id === data.commentId) {
        const reactions = data.action === 'add'
          ? [...c.reactions.filter(r => !(r.emoji === data.reaction.emoji && r.userId === data.reaction.userId)), data.reaction]
          : c.reactions.filter(r => !(r.emoji === data.reaction.emoji && r.userId === data.reaction.userId));
        
        return { ...c, reactions };
      }
      return c;
    }));
  };

  // Mostrar notificação de menção
  const showMentionNotification = (comment: Comment) => {
    // Implementar notificação visual/sonora
    console.log('Você foi mencionado em um comentário:', comment.content);
  };

  // Adicionar comentário
  const addComment = async (content: string, parentId?: string, elementId?: string, timelinePosition?: number) => {
    if (!currentUser || !content.trim()) return;
    
    const mentions = extractMentions(content);
    
    const comment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      content: content.trim(),
      timestamp: new Date(),
      elementId,
      timelinePosition,
      parentId,
      mentions,
      attachments: [...attachments],
      resolved: false,
      reactions: [],
      edited: false
    };
    
    // Enviar via WebSocket
    realtimeService.send('comment:add', comment);
    
    // Adicionar localmente
    setComments(prev => [...prev, comment]);
    
    // Limpar formulário
    setNewComment('');
    setAttachments([]);
    setReplyingTo(null);
    
    onCommentAdded?.(comment);
  };

  // Extrair menções do texto
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@([\w\s]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1].trim();
      const user = collaborators.find(c => c.username.toLowerCase() === username.toLowerCase());
      if (user) {
        mentions.push(user.id);
      }
    }
    
    return mentions;
  };

  // Processar input de menções
  const handleMentionInput = (value: string) => {
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex === -1) {
      setShowMentions(false);
      return;
    }
    
    const query = value.substring(lastAtIndex + 1).toLowerCase();
    const suggestions = collaborators.filter(c => 
      c.username.toLowerCase().includes(query) && c.id !== currentUser?.id
    ).slice(0, 5);
    
    setMentionSuggestions(suggestions);
    setShowMentions(suggestions.length > 0);
  };

  // Inserir menção
  const insertMention = (user: any) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    const beforeMention = newComment.substring(0, lastAtIndex);
    const afterMention = newComment.substring(newComment.indexOf(' ', lastAtIndex) + 1);
    
    setNewComment(`${beforeMention}@${user.username} ${afterMention}`);
    setShowMentions(false);
    commentInputRef.current?.focus();
  };

  // Adicionar anexo
  const addAttachment = async (file: File) => {
    const attachment: CommentAttachment = {
      id: `attachment-${Date.now()}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file),
      size: file.size,
      thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    };
    
    setAttachments(prev => [...prev, attachment]);
  };

  // Remover anexo
  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  // Resolver comentário
  const resolveComment = (commentId: string) => {
    realtimeService.send('comment:resolve', { commentId });
    
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ));
  };

  // Adicionar reação
  const addReaction = (commentId: string, emoji: string) => {
    if (!currentUser) return;
    
    const reaction: CommentReaction = {
      emoji,
      userId: currentUser.id,
      username: currentUser.username
    };
    
    realtimeService.send('comment:reaction', { commentId, reaction, action: 'add' });
  };

  // Filtrar comentários
  const getFilteredThreads = () => {
    return threads.filter(thread => {
      switch (filter) {
        case 'unresolved':
          return !thread.resolved;
        case 'mentions':
          return thread.rootComment.mentions.includes(currentUser?.id || '') ||
                 thread.replies.some(r => r.mentions.includes(currentUser?.id || ''));
        case 'mine':
          return thread.rootComment.userId === currentUser?.id ||
                 thread.replies.some(r => r.userId === currentUser?.id);
        default:
          return true;
      }
    });
  };

  // Renderizar marcadores na timeline
  const renderMarkers = () => {
    return markers.map(marker => (
      <div
        key={marker.commentId}
        className={`absolute w-6 h-6 rounded-full cursor-pointer transition-all duration-200 z-30 ${
          marker.unread ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'
        }`}
        style={{
          left: marker.x,
          top: marker.y,
          transform: 'translate(-50%, -50%)'
        }}
        onClick={() => {
          setActiveThread(marker.commentId);
          setShowCommentPanel(true);
        }}
        title="Ver comentário"
      >
        <MessageCircle size={16} className="text-white m-1" />
        {marker.unread && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full" />
        )}
      </div>
    ));
  };

  // Renderizar thread de comentários
  const renderThread = (thread: CommentThread) => {
    const { rootComment, replies } = thread;
    
    return (
      <div key={thread.id} className="border-b border-gray-200 pb-4 mb-4">
        {/* Comentário raiz */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {rootComment.username.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{rootComment.username}</span>
              <span className="text-xs text-gray-500">
                {rootComment.timestamp.toLocaleString()}
              </span>
              {rootComment.resolved && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Resolvido
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-800 mb-2">
              {renderCommentContent(rootComment.content)}
            </div>
            
            {/* Anexos */}
            {rootComment.attachments.length > 0 && (
              <div className="flex gap-2 mb-2">
                {rootComment.attachments.map(attachment => (
                  <div key={attachment.id} className="relative">
                    {attachment.type === 'image' ? (
                      <img 
                        src={attachment.url} 
                        alt={attachment.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                        <File size={20} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Reações */}
            {rootComment.reactions.length > 0 && (
              <div className="flex gap-1 mb-2">
                {Object.entries(
                  rootComment.reactions.reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
                    onClick={() => addReaction(rootComment.id, emoji)}
                  >
                    {emoji} {count}
                  </button>
                ))}
              </div>
            )}
            
            {/* Ações */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <button 
                className="hover:text-blue-500 transition-colors"
                onClick={() => setReplyingTo(rootComment.id)}
              >
                <Reply size={14} className="inline mr-1" />
                Responder
              </button>
              
              <button 
                className="hover:text-green-500 transition-colors"
                onClick={() => addReaction(rootComment.id, '👍')}
              >
                👍
              </button>
              
              {!rootComment.resolved && (
                <button 
                  className="hover:text-green-500 transition-colors"
                  onClick={() => resolveComment(rootComment.id)}
                >
                  <Check size={14} className="inline mr-1" />
                  Resolver
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Respostas */}
        {replies.length > 0 && (
          <div className="ml-11 mt-3 space-y-3">
            {replies.map(reply => (
              <div key={reply.id} className="flex gap-3">
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                  {reply.username.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{reply.username}</span>
                    <span className="text-xs text-gray-500">
                      {reply.timestamp.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-800">
                    {renderCommentContent(reply.content)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Formulário de resposta */}
        {replyingTo === rootComment.id && (
          <div className="ml-11 mt-3">
            <div className="relative">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  handleMentionInput(e.target.value);
                }}
                placeholder="Escreva uma resposta..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              
              {/* Sugestões de menção */}
              {showMentions && mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 mb-1">
                  {mentionSuggestions.map(user => (
                    <button
                      key={user.id}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                      onClick={() => insertMention(user)}
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{user.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Anexar arquivo"
                >
                  <Paperclip size={16} />
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setNewComment('');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={() => addComment(newComment, rootComment.id)}
                  disabled={!newComment.trim()}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Responder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar conteúdo do comentário com menções
  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@[\w\s]+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1).trim();
        const user = collaborators.find(c => c.username.toLowerCase() === username.toLowerCase());
        
        return (
          <span
            key={index}
            className="text-blue-500 font-medium cursor-pointer hover:underline"
            onClick={() => user && onMentionUser?.(user.id)}
          >
            {part}
          </span>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  if (!isConnected) {
    return null;
  }

  return (
    <>
      {/* Marcadores na timeline */}
      {timelineRef.current && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {renderMarkers()}
          </div>
        </div>
      )}

      {/* Menu de contexto */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
            onClick={() => {
              setShowCommentPanel(true);
              setContextMenu(null);
              // Focar no input de comentário
              setTimeout(() => commentInputRef.current?.focus(), 100);
            }}
          >
            <MessageCircle size={16} />
            Adicionar comentário
          </button>
        </div>
      )}

      {/* Botão flutuante para abrir painel */}
      <button
        onClick={() => setShowCommentPanel(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 z-40 flex items-center justify-center"
        title="Comentários"
      >
        <MessageCircle size={24} />
        {threads.filter(t => !t.resolved).length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {threads.filter(t => !t.resolved).length}
          </div>
        )}
      </button>

      {/* Painel de comentários */}
      {showCommentPanel && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Comentários</h3>
              <button
                onClick={() => setShowCommentPanel(false)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Filtros */}
            <div className="flex gap-1">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'unresolved', label: 'Pendentes' },
                { key: 'mentions', label: 'Menções' },
                { key: 'mine', label: 'Meus' }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === filterOption.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de comentários */}
          <div className="flex-1 overflow-y-auto p-4">
            {getFilteredThreads().length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum comentário encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredThreads().map(renderThread)}
              </div>
            )}
          </div>

          {/* Formulário de novo comentário */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  handleMentionInput(e.target.value);
                }}
                placeholder="Escreva um comentário..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              
              {/* Sugestões de menção */}
              {showMentions && mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 mb-1">
                  {mentionSuggestions.map(user => (
                    <button
                      key={user.id}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                      onClick={() => insertMention(user)}
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{user.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Anexos */}
            {attachments.length > 0 && (
              <div className="flex gap-2 mt-2">
                {attachments.map(attachment => (
                  <div key={attachment.id} className="relative">
                    {attachment.type === 'image' ? (
                      <img 
                        src={attachment.url} 
                        alt={attachment.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                        <File size={16} className="text-gray-500" />
                      </div>
                    )}
                    
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Anexar arquivo"
                >
                  <Paperclip size={16} />
                </button>
                
                <button
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Mencionar usuário"
                >
                  <AtSign size={16} />
                </button>
              </div>
              
              <button
                onClick={() => addComment(newComment)}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(addAttachment);
          e.target.value = '';
        }}
        className="hidden"
      />
    </>
  );
};

export default CommentSystem;