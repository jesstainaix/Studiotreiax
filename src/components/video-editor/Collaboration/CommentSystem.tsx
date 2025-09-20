import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Check,
  X,
  Reply,
  MoreHorizontal,
  User,
  Clock,
  AtSign
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Comment, User as UserType } from '../../../types/collaboration';

interface CommentSystemProps {
  comments: Comment[];
  users: UserType[];
  currentUserId?: string;
  onAddComment: (content: string, position: { x: number; y: number; timelinePosition?: number }) => void;
  onResolveComment: (commentId: string) => void;
  onReplyToComment?: (commentId: string, content: string) => void;
  className?: string;
  overlayMode?: boolean;
}

const CommentSystem: React.FC<CommentSystemProps> = ({
  comments,
  users,
  currentUserId,
  onAddComment,
  onResolveComment,
  onReplyToComment,
  className = '',
  overlayMode = false
}) => {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentPosition, setNewCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  // Filter comments based on resolved status
  const filteredComments = comments.filter(comment => 
    showResolved ? true : !comment.resolved
  );

  // Handle right-click to add comment
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      // Only handle if Ctrl/Cmd is pressed
      if (!event.ctrlKey && !event.metaKey) return;
      
      event.preventDefault();
      setNewCommentPosition({ x: event.clientX, y: event.clientY });
      setIsAddingComment(true);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  if (overlayMode) {
    return (
      <div className={`absolute inset-0 pointer-events-none ${className}`}>
        {/* Comment Markers */}
        <AnimatePresence>
          {filteredComments.map(comment => (
            <CommentMarker
              key={comment.id}
              comment={comment}
              users={users}
              currentUserId={currentUserId}
              isSelected={selectedComment === comment.id}
              onSelect={() => setSelectedComment(comment.id)}
              onResolve={() => onResolveComment(comment.id)}
              onReply={onReplyToComment}
            />
          ))}
        </AnimatePresence>

        {/* Add Comment Form */}
        <AnimatePresence>
          {isAddingComment && newCommentPosition && (
            <AddCommentForm
              position={newCommentPosition}
              onSubmit={(content) => {
                onAddComment(content, newCommentPosition);
                setIsAddingComment(false);
                setNewCommentPosition(null);
              }}
              onCancel={() => {
                setIsAddingComment(false);
                setNewCommentPosition(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Comment Markers */}
      <AnimatePresence>
        {filteredComments.map(comment => (
          <CommentMarker
            key={comment.id}
            comment={comment}
            users={users}
            currentUserId={currentUserId}
            isSelected={selectedComment === comment.id}
            onSelect={() => setSelectedComment(comment.id)}
            onResolve={() => onResolveComment(comment.id)}
            onReply={onReplyToComment}
          />
        ))}
      </AnimatePresence>

      {/* Add Comment Form */}
      <AnimatePresence>
        {isAddingComment && newCommentPosition && (
          <AddCommentForm
            position={newCommentPosition}
            onSubmit={(content) => {
              onAddComment(content, newCommentPosition);
              setIsAddingComment(false);
              setNewCommentPosition(null);
            }}
            onCancel={() => {
              setIsAddingComment(false);
              setNewCommentPosition(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Comments Panel */}
      <CommentPanel
        comments={filteredComments}
        users={users}
        currentUserId={currentUserId}
        showResolved={showResolved}
        onToggleResolved={() => setShowResolved(!showResolved)}
        onSelectComment={setSelectedComment}
        onResolveComment={onResolveComment}
        onReplyToComment={onReplyToComment}
      />
    </div>
  );
};

interface CommentMarkerProps {
  comment: Comment;
  users: UserType[];
  currentUserId?: string;
  isSelected: boolean;
  onSelect: () => void;
  onResolve: () => void;
  onReply?: (commentId: string, content: string) => void;
}

const CommentMarker: React.FC<CommentMarkerProps> = ({
  comment,
  users,
  currentUserId,
  isSelected,
  onSelect,
  onResolve,
  onReply
}) => {
  const user = users.find(u => u.id === comment.userId);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute z-40"
      style={{
        left: comment.position.x,
        top: comment.position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSelect}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all
          ${comment.resolved 
            ? 'bg-green-500 text-white' 
            : isSelected 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-700 border-2 border-blue-500'
          }
        `}
      >
        {comment.resolved ? (
          <Check className="w-4 h-4" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap max-w-xs">
              <div className="font-medium">{user?.name || 'Unknown User'}</div>
              <div className="text-gray-300 text-xs">
                {new Date(comment.timestamp).toLocaleString()}
              </div>
              <div className="mt-1">{comment.content}</div>
              
              {/* Arrow */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Comment */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50"
          >
            <CommentCard
              comment={comment}
              user={user}
              currentUserId={currentUserId}
              onResolve={onResolve}
              onReply={onReply}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface AddCommentFormProps {
  position: { x: number; y: number };
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

const AddCommentForm: React.FC<AddCommentFormProps> = ({
  position,
  onSubmit,
  onCancel
}) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border p-4 w-80">
        <form onSubmit={handleSubmit}>
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Adicione um comentário..."
            className="mb-3 resize-none"
            rows={3}
          />
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim()}
            >
              <Send className="w-4 h-4 mr-1" />
              Comentar
            </Button>
          </div>
        </form>
        
        {/* Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-r border-b rotate-45" />
      </div>
    </motion.div>
  );
};

interface CommentCardProps {
  comment: Comment;
  user?: UserType;
  currentUserId?: string;
  onResolve: () => void;
  onReply?: (commentId: string, content: string) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  user,
  currentUserId,
  onResolve,
  onReply
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim() && onReply) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border p-4 w-80 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>
              <User className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{user?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(comment.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {!comment.resolved && (
              <DropdownMenuItem onClick={onResolve}>
                <Check className="w-4 h-4 mr-2" />
                Resolver
              </DropdownMenuItem>
            )}
            {onReply && (
              <DropdownMenuItem onClick={() => setIsReplying(true)}>
                <Reply className="w-4 h-4 mr-2" />
                Responder
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-sm text-gray-700">{comment.content}</p>
        
        {/* Mentions */}
        {comment.mentions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {comment.mentions.map((mention, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <AtSign className="w-3 h-3 mr-1" />
                {mention}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      {comment.resolved && (
        <div className="flex items-center gap-1 mb-3">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600">Resolvido</span>
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="border-l-2 border-gray-200 pl-3 mb-3">
          <div className="text-xs text-gray-500 mb-2">
            {comment.replies.length} resposta(s)
          </div>
          {comment.replies.map((reply, index) => (
            <div key={index} className="mb-2 last:mb-0">
              <div className="text-xs text-gray-600">{reply.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {isReplying && (
        <form onSubmit={handleReply} className="mt-3">
          <Input
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Escreva uma resposta..."
            className="mb-2"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReplying(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!replyContent.trim()}
            >
              Responder
            </Button>
          </div>
        </form>
      )}
      
      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-r border-b rotate-45" />
    </div>
  );
};

interface CommentPanelProps {
  comments: Comment[];
  users: UserType[];
  currentUserId?: string;
  showResolved: boolean;
  onToggleResolved: () => void;
  onSelectComment: (commentId: string) => void;
  onResolveComment: (commentId: string) => void;
  onReplyToComment?: (commentId: string, content: string) => void;
}

const CommentPanel: React.FC<CommentPanelProps> = ({
  comments,
  users,
  currentUserId,
  showResolved,
  onToggleResolved,
  onSelectComment,
  onResolveComment,
  onReplyToComment
}) => {
  const unresolvedCount = comments.filter(c => !c.resolved).length;
  const resolvedCount = comments.filter(c => c.resolved).length;

  return (
    <div className="fixed right-4 top-20 w-80 bg-white rounded-lg shadow-xl border max-h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comentários
          </h3>
          <Badge variant="secondary">
            {showResolved ? resolvedCount : unresolvedCount}
          </Badge>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleResolved}
          className="w-full"
        >
          {showResolved ? 'Mostrar Pendentes' : 'Mostrar Resolvidos'}
        </Button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {showResolved ? 'Nenhum comentário resolvido' : 'Nenhum comentário pendente'}
            </p>
            <p className="text-xs mt-1">
              Ctrl+Click para adicionar comentário
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => {
              const user = users.find(u => u.id === comment.userId);
              return (
                <div
                  key={comment.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onSelectComment(comment.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>
                          <User className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user?.name}</span>
                    </div>
                    
                    {comment.resolved ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResolveComment(comment.id);
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-1">{comment.content}</p>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(comment.timestamp).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSystem;