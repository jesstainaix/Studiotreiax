import { useState, useEffect, useRef, useCallback } from 'react';

// Interfaces para colaboração em tempo real
export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
  cursor?: {
    x: number;
    y: number;
    selection?: {
      start: number;
      end: number;
    };
  };
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    isAdmin: boolean;
  };
}

export interface CollaborationSession {
  id: string;
  name: string;
  documentId: string;
  createdAt: Date;
  updatedAt: Date;
  users: CollaborationUser[];
  isActive: boolean;
  settings: {
    allowAnonymous: boolean;
    maxUsers: number;
    autoSave: boolean;
    versionControl: boolean;
  };
}

export interface EditOperation {
  id: string;
  type: 'insert' | 'delete' | 'replace' | 'format';
  position: number;
  content: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  position: {
    start: number;
    end: number;
  };
  createdAt: Date;
  updatedAt: Date;
  replies: Comment[];
  isResolved: boolean;
  mentions: string[];
}

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  type: 'text' | 'file' | 'image' | 'system';
  timestamp: Date;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    mentions?: string[];
  };
}

export interface WhiteboardElement {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'text' | 'image' | 'sticky';
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
  };
  content?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  permissions: {
    canView: string[];
    canEdit: string[];
    canDownload: string[];
  };
  version: number;
  isLocked: boolean;
}

export interface ActivityEvent {
  id: string;
  type: 'join' | 'leave' | 'edit' | 'comment' | 'share' | 'chat' | 'whiteboard';
  userId: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface VideoCallState {
  isActive: boolean;
  participants: {
    userId: string;
    stream?: MediaStream;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    isScreenSharing: boolean;
  }[];
  localStream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
}

export interface CollaborationConfig {
  websocketUrl: string;
  stunServers: string[];
  turnServers: {
    urls: string;
    username?: string;
    credential?: string;
  }[];
  maxFileSize: number;
  allowedFileTypes: string[];
  autoSaveInterval: number;
  conflictResolution: 'last-write-wins' | 'operational-transform' | 'manual';
  enableVoiceChat: boolean;
  enableVideoChat: boolean;
  enableScreenShare: boolean;
  enableWhiteboard: boolean;
}

const defaultConfig: CollaborationConfig = {
  websocketUrl: 'ws://localhost:8080/collaboration',
  stunServers: ['stun:stun.l.google.com:19302'],
  turnServers: [],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  autoSaveInterval: 5000,
  conflictResolution: 'operational-transform',
  enableVoiceChat: true,
  enableVideoChat: true,
  enableScreenShare: true,
  enableWhiteboard: true
};

export const useRealTimeCollaboration = (sessionId: string, config: Partial<CollaborationConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  // Estados principais
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [operations, setOperations] = useState<EditOperation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [videoCall, setVideoCall] = useState<VideoCallState>({
    isActive: false,
    participants: [],
    isVideoEnabled: false,
    isAudioEnabled: false,
    isScreenSharing: false
  });
  
  // Estados de conexão
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Conectar ao WebSocket
  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(`${finalConfig.websocketUrl}?sessionId=${sessionId}`);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setIsReconnecting(false);
        setConnectionError(null);
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        // Tentar reconectar após 3 segundos
        setTimeout(() => {
          setIsReconnecting(true);
          connect();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        setConnectionError('Erro de conexão com o servidor');
        console.error('Erro WebSocket:', error);
      };
    } catch (error) {
      setConnectionError('Falha ao conectar com o servidor');
      console.error('Erro ao conectar:', error);
    }
  }, [sessionId, finalConfig.websocketUrl]);
  
  // Desconectar
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Fechar todas as conexões peer
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    // Parar stream local
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setIsConnected(false);
  }, []);
  
  // Manipular mensagens WebSocket
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'session_joined':
        setSession(data.session);
        setCurrentUser(data.user);
        break;
        
      case 'user_joined':
        setUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
        addActivityEvent({
          id: Date.now().toString(),
          type: 'join',
          userId: data.user.id,
          description: `${data.user.name} entrou na sessão`,
          timestamp: new Date()
        });
        break;
        
      case 'user_left':
        setUsers(prev => prev.filter(u => u.id !== data.userId));
        addActivityEvent({
          id: Date.now().toString(),
          type: 'leave',
          userId: data.userId,
          description: `Usuário saiu da sessão`,
          timestamp: new Date()
        });
        break;
        
      case 'cursor_moved':
        setUsers(prev => prev.map(u => 
          u.id === data.userId 
            ? { ...u, cursor: data.cursor }
            : u
        ));
        break;
        
      case 'operation_applied':
        setOperations(prev => [...prev, data.operation]);
        break;
        
      case 'comment_added':
        setComments(prev => [...prev, data.comment]);
        break;
        
      case 'chat_message':
        setChatMessages(prev => [...prev, data.message]);
        break;
        
      case 'whiteboard_updated':
        setWhiteboardElements(data.elements);
        break;
        
      case 'file_shared':
        setSharedFiles(prev => [...prev, data.file]);
        break;
        
      case 'webrtc_offer':
      case 'webrtc_answer':
      case 'webrtc_ice_candidate':
        handleWebRTCSignaling(data);
        break;
    }
  }, []);
  
  // Enviar mensagem WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);
  
  // Ações de edição colaborativa
  const applyOperation = useCallback((operation: Omit<EditOperation, 'id' | 'timestamp'>) => {
    const fullOperation: EditOperation = {
      ...operation,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    sendMessage({
      type: 'apply_operation',
      operation: fullOperation
    });
  }, [sendMessage]);
  
  // Atualizar cursor
  const updateCursor = useCallback((cursor: { x: number; y: number; selection?: { start: number; end: number } }) => {
    sendMessage({
      type: 'cursor_update',
      cursor
    });
  }, [sendMessage]);
  
  // Adicionar comentário
  const addComment = useCallback((comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>) => {
    const fullComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: []
    };
    
    sendMessage({
      type: 'add_comment',
      comment: fullComment
    });
  }, [sendMessage]);
  
  // Enviar mensagem de chat
  const sendChatMessage = useCallback((content: string, type: ChatMessage['type'] = 'text', metadata?: ChatMessage['metadata']) => {
    if (!currentUser) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      content,
      userId: currentUser.id,
      type,
      timestamp: new Date(),
      metadata
    };
    
    sendMessage({
      type: 'chat_message',
      message
    });
  }, [currentUser, sendMessage]);
  
  // Atualizar whiteboard
  const updateWhiteboard = useCallback((elements: WhiteboardElement[]) => {
    sendMessage({
      type: 'update_whiteboard',
      elements
    });
  }, [sendMessage]);
  
  // Compartilhar arquivo
  const shareFile = useCallback(async (file: File) => {
    if (!currentUser) return;
    
    // Simular upload (implementar upload real conforme necessário)
    const sharedFile: SharedFile = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadedBy: currentUser.id,
      uploadedAt: new Date(),
      permissions: {
        canView: users.map(u => u.id),
        canEdit: [currentUser.id],
        canDownload: users.map(u => u.id)
      },
      version: 1,
      isLocked: false
    };
    
    sendMessage({
      type: 'share_file',
      file: sharedFile
    });
  }, [currentUser, users, sendMessage]);
  
  // WebRTC para vídeo/áudio
  const handleWebRTCSignaling = useCallback(async (data: any) => {
    const { userId, type } = data;
    
    let peerConnection = peerConnectionsRef.current.get(userId);
    
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({
        iceServers: [
          ...finalConfig.stunServers.map(url => ({ urls: url })),
          ...finalConfig.turnServers
        ]
      });
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: 'webrtc_ice_candidate',
            targetUserId: userId,
            candidate: event.candidate
          });
        }
      };
      
      peerConnection.ontrack = (event) => {
        setVideoCall(prev => ({
          ...prev,
          participants: prev.participants.map(p => 
            p.userId === userId 
              ? { ...p, stream: event.streams[0] }
              : p
          )
        }));
      };
      
      peerConnectionsRef.current.set(userId, peerConnection);
    }
    
    switch (type) {
      case 'webrtc_offer':
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendMessage({
          type: 'webrtc_answer',
          targetUserId: userId,
          answer
        });
        break;
        
      case 'webrtc_answer':
        await peerConnection.setRemoteDescription(data.answer);
        break;
        
      case 'webrtc_ice_candidate':
        await peerConnection.addIceCandidate(data.candidate);
        break;
    }
  }, [finalConfig.stunServers, finalConfig.turnServers, sendMessage]);
  
  // Iniciar chamada de vídeo
  const startVideoCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      setVideoCall(prev => ({
        ...prev,
        isActive: true,
        localStream: stream,
        isVideoEnabled: true,
        isAudioEnabled: true
      }));
      
      // Criar ofertas para todos os usuários
      for (const user of users) {
        if (user.id !== currentUser?.id) {
          const peerConnection = new RTCPeerConnection({
            iceServers: [
              ...finalConfig.stunServers.map(url => ({ urls: url })),
              ...finalConfig.turnServers
            ]
          });
          
          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
          });
          
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          sendMessage({
            type: 'webrtc_offer',
            targetUserId: user.id,
            offer
          });
          
          peerConnectionsRef.current.set(user.id, peerConnection);
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar chamada de vídeo:', error);
    }
  }, [users, currentUser, finalConfig.stunServers, finalConfig.turnServers, sendMessage]);
  
  // Parar chamada de vídeo
  const stopVideoCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    setVideoCall({
      isActive: false,
      participants: [],
      isVideoEnabled: false,
      isAudioEnabled: false,
      isScreenSharing: false
    });
  }, []);
  
  // Compartilhar tela
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Substituir track de vídeo nas conexões existentes
      const videoTrack = stream.getVideoTracks()[0];
      
      peerConnectionsRef.current.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });
      
      setVideoCall(prev => ({
        ...prev,
        isScreenSharing: true
      }));
      
      // Parar compartilhamento quando usuário parar
      videoTrack.onended = () => {
        setVideoCall(prev => ({
          ...prev,
          isScreenSharing: false
        }));
      };
    } catch (error) {
      console.error('Erro ao compartilhar tela:', error);
    }
  }, []);
  
  // Adicionar evento de atividade
  const addActivityEvent = useCallback((event: ActivityEvent) => {
    setActivityFeed(prev => [event, ...prev].slice(0, 100)); // Manter apenas os últimos 100 eventos
  }, []);
  
  // Auto-save
  useEffect(() => {
    if (finalConfig.autoSaveInterval > 0) {
      autoSaveTimerRef.current = setInterval(() => {
        // Implementar auto-save conforme necessário
      }, finalConfig.autoSaveInterval);
      
      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [finalConfig.autoSaveInterval]);
  
  // Conectar ao inicializar
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Valores computados
  const onlineUsers = users.filter(u => u.isOnline);
  const totalOperations = operations.length;
  const unreadComments = comments.filter(c => !c.isResolved).length;
  const unreadMessages = chatMessages.length; // Implementar lógica de leitura
  const activeParticipants = videoCall.participants.length;
  
  return {
    // Estados
    session,
    currentUser,
    users,
    onlineUsers,
    operations,
    comments,
    chatMessages,
    whiteboardElements,
    sharedFiles,
    activityFeed,
    videoCall,
    
    // Estados de conexão
    isConnected,
    isReconnecting,
    connectionError,
    
    // Ações de colaboração
    connect,
    disconnect,
    applyOperation,
    updateCursor,
    addComment,
    sendChatMessage,
    updateWhiteboard,
    shareFile,
    
    // Ações de vídeo/áudio
    startVideoCall,
    stopVideoCall,
    startScreenShare,
    
    // Valores computados
    totalOperations,
    unreadComments,
    unreadMessages,
    activeParticipants,
    
    // Configuração
    config: finalConfig
  };
};

export default useRealTimeCollaboration;