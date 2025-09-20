import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Plus, 
  X, 
  Send, 
  Reply, 
  Edit3, 
  Trash2, 
  Pin, 
  Clock, 
  User,
  MoreVertical,
  Check,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { ProjectAnnotation } from '../../types/collaboration';
import { toast } from 'sonner';

interface TimelineCommentsProps {
  projectId: string;
  timelinePosition: number; // Posição no timeline em segundos
  duration: number; // Duração total do projeto
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: number; // Posição no timeline
  createdAt: Date;
  updatedAt?: Date;
  replies: Comment[];
  isPinned: boolean;
  isResolved: boolean;
  type: 'comment' | 'annotation' | 'suggestion';
  metadata?: {
    elementId?: string;
    coordinates?: { x: number; y: number };
    color?: string;
  };
}

interface NewCommentData {
  content: string;
  timestamp: number;
  type: 'comment' | 'annotation' | 'suggestion';
  parentId?: string;
}

export function TimelineComments({ 
  projectId, 
  timelinePosition, 
  duration, 
  isVisible, 
  onToggleVisibility 
}: TimelineCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showNewComment, setShowNewComment] = useState(false);
  const [selectedType, setSelectedType] = useState<'comment' | 'annotation' | 'suggestion'>('comment');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'pinned'>('all');
  const [loading, setLoading] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const newCommentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments();
  }, [projectId]);

  useEffect(() => {
    if (showNewComment && newCommentRef.current) {
      newCommentRef.current.focus();
    }
  }, [showNewComment]);

  const loadComments = async () => {
    try {
      setLoading(true);
      
      // Simular carregamento de comentários
      const mockComments: Comment[] = [
        {
          id: '1',
          content: 'Esta transição precisa ser mais suave. Que tal aumentar a duração para 0.5s?',
          author: {
            id: 'user1',
            name: 'Maria Silva',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face'
          },
          timestamp: 15.5,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          replies: [
            {
              id: '1-1',
              content: 'Concordo! Vou ajustar isso agora.',
              author: {
                id: 'user2',
                name: 'João Santos'
              },
              timestamp: 15.5,
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
              replies: [],
              isPinned: false,
              isResolved: false,
              type: 'comment'
            }
          ],
          isPinned: true,
          isResolved: false,
          type: 'suggestion'
        },
        {
          id: '2',
          content: 'Lembrar de adicionar legenda nesta parte do vídeo',
          author: {
            id: 'user3',
            name: 'Pedro Costa'
          },
          timestamp: 32.2,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          replies: [],
          isPinned: false,
          isResolved: true,
          type: 'annotation',
          metadata: {
            color: '#ff6b6b'
          }
        },
        {
          id: '3',
          content: 'O áudio está um pouco baixo aqui. Podemos aumentar o volume?',
          author: {
            id: 'user1',
            name: 'Maria Silva'
          },
          timestamp: 45.8,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          replies: [],
          isPinned: false,
          isResolved: false,
          type: 'comment'
        }
      ];
      
      setComments(mockComments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const commentData: NewCommentData = {
        content: newComment.trim(),
        timestamp: timelinePosition,
        type: selectedType
      };

      // Simular criação do comentário
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: commentData.content,
        author: {
          id: 'current-user',
          name: 'Você'
        },
        timestamp: commentData.timestamp,
        createdAt: new Date(),
        replies: [],
        isPinned: false,
        isResolved: false,
        type: commentData.type
      };

      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
      setShowNewComment(false);
      toast.success('Comentário adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!content.trim()) return;

    try {
      const reply: Comment = {
        id: `${parentId}-${Date.now()}`,
        content: content.trim(),
        author: {
          id: 'current-user',
          name: 'Você'
        },
        timestamp: timelinePosition,
        createdAt: new Date(),
        replies: [],
        isPinned: false,
        isResolved: false,
        type: 'comment'
      };

      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      ));
      
      setReplyingTo(null);
      toast.success('Resposta adicionada!');
    } catch (error) {
      console.error('Erro ao adicionar resposta:', error);
      toast.error('Erro ao adicionar resposta');
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;

    try {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: newContent.trim(), updatedAt: new Date() }
          : comment
      ));
      
      setEditingComment(null);
      setEditContent('');
      toast.success('Comentário atualizado!');
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      toast.error('Erro ao editar comentário');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

    try {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success('Comentário excluído!');
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      toast.error('Erro ao excluir comentário');
    }
  };

  const handleTogglePin = async (commentId: string) => {
    try {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, isPinned: !comment.isPinned }
          : comment
      ));
    } catch (error) {
      console.error('Erro ao fixar comentário:', error);
      toast.error('Erro ao fixar comentário');
    }
  };

  const handleToggleResolve = async (commentId: string) => {
    try {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, isResolved: !comment.isResolved }
          : comment
      ));
    } catch (error) {
      console.error('Erro ao resolver comentário:', error);
      toast.error('Erro ao resolver comentário');
    }
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora há pouco';
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getTypeIcon = (type: Comment['type']) => {
    switch (type) {
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'annotation': return <Pin className="w-4 h-4 text-orange-500" />;
      case 'suggestion': return <AlertCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getTypeLabel = (type: Comment['type']) => {
    switch (type) {
      case 'comment': return 'Comentário';
      case 'annotation': return 'Anotação';
      case 'suggestion': return 'Sugestão';
    }
  };

  const filteredComments = comments.filter(comment => {
    switch (filter) {
      case 'unresolved': return !comment.isResolved;
      case 'pinned': return comment.isPinned;
      default: return true;
    }
  });

  const commentsNearCurrentTime = filteredComments.filter(comment => 
    Math.abs(comment.timestamp - timelinePosition) <= 5
  );

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Comentários
          </h3>
          <button
            onClick={onToggleVisibility}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Filtros */}
        <div className="flex space-x-1 mb-3">
          {(['all', 'unresolved', 'pinned'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filterType === 'all' ? 'Todos' :
               filterType === 'unresolved' ? 'Pendentes' : 'Fixados'}
            </button>
          ))}
        </div>
        
        {/* Botão adicionar comentário */}
        <button
          onClick={() => setShowNewComment(true)}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Comentário
        </button>
      </div>

      {/* Lista de comentários */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              {filter === 'all' ? 'Nenhum comentário ainda' :
               filter === 'unresolved' ? 'Nenhum comentário pendente' :
               'Nenhum comentário fixado'}
            </p>
          </div>
        ) : (
          <>
            {/* Comentários próximos ao tempo atual */}
            {commentsNearCurrentTime.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Próximos ao tempo atual
                </h4>
                <div className="space-y-3">
                  {commentsNearCurrentTime.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReply={handleReply}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      onTogglePin={handleTogglePin}
                      onToggleResolve={handleToggleResolve}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      editingComment={editingComment}
                      setEditingComment={setEditingComment}
                      editContent={editContent}
                      setEditContent={setEditContent}
                      formatTimestamp={formatTimestamp}
                      formatTimeAgo={formatTimeAgo}
                      getTypeIcon={getTypeIcon}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Todos os comentários */}
            <div className="space-y-3">
              {filteredComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  onTogglePin={handleTogglePin}
                  onToggleResolve={handleToggleResolve}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  editingComment={editingComment}
                  setEditingComment={setEditingComment}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  formatTimestamp={formatTimestamp}
                  formatTimeAgo={formatTimeAgo}
                  getTypeIcon={getTypeIcon}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de novo comentário */}
      {showNewComment && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-[90vw]">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Novo Comentário</h4>
                <button
                  onClick={() => setShowNewComment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Tempo: {formatTimestamp(timelinePosition)}
              </p>
            </div>
            
            <div className="p-4">
              {/* Tipo de comentário */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <div className="flex space-x-2">
                  {(['comment', 'annotation', 'suggestion'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        selectedType === type
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getTypeIcon(type)}
                      <span>{getTypeLabel(type)}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Conteúdo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentário
                </label>
                <textarea
                  ref={newCommentRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Digite seu comentário..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
              
              {/* Botões */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNewComment(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para item de comentário
interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onTogglePin: (commentId: string) => void;
  onToggleResolve: (commentId: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  editingComment: string | null;
  setEditingComment: (id: string | null) => void;
  editContent: string;
  setEditContent: (content: string) => void;
  formatTimestamp: (seconds: number) => string;
  formatTimeAgo: (date: Date) => string;
  getTypeIcon: (type: Comment['type']) => React.ReactNode;
}

function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleResolve,
  replyingTo,
  setReplyingTo,
  editingComment,
  setEditingComment,
  editContent,
  setEditContent,
  formatTimestamp,
  formatTimeAgo,
  getTypeIcon
}: CommentItemProps) {
  const [replyContent, setReplyContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleStartEdit = () => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleSubmitEdit = () => {
    onEdit(comment.id, editContent);
  };

  const handleStartReply = () => {
    setReplyingTo(comment.id);
    setShowMenu(false);
  };

  const handleSubmitReply = () => {
    onReply(comment.id, replyContent);
    setReplyContent('');
  };

  return (
    <div className={`border rounded-lg p-3 ${
      comment.isResolved ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {comment.author.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-gray-600" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
          {getTypeIcon(comment.type)}
          {comment.isPinned && <Pin className="w-3 h-3 text-orange-500" />}
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-32">
                <button
                  onClick={handleStartReply}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Reply className="w-3 h-3" />
                  <span>Responder</span>
                </button>
                <button
                  onClick={handleStartEdit}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onTogglePin(comment.id)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Pin className="w-3 h-3" />
                  <span>{comment.isPinned ? 'Desafixar' : 'Fixar'}</span>
                </button>
                <button
                  onClick={() => onToggleResolve(comment.id)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Check className="w-3 h-3" />
                  <span>{comment.isResolved ? 'Reabrir' : 'Resolver'}</span>
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Excluir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {editingComment === comment.id ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            rows={2}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitEdit}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatTimeAgo(comment.createdAt)}</span>
        {comment.updatedAt && (
          <span>(editado)</span>
        )}
      </div>
      
      {/* Respostas */}
      {comment.replies.length > 0 && (
        <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-100 pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 rounded p-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-medium text-gray-700">{reply.author.name}</span>
                <span className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-600">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Campo de resposta */}
      {replyingTo === comment.id && (
        <div className="mt-3 space-y-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Digite sua resposta..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            rows={2}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setReplyingTo(null)}
              className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim()}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Responder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}