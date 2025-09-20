import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService } from '../services/realtimeService';
import { collaborationEngine } from '../services/collaborationEngine';
import { presenceManager } from '../services/presenceManager';

export interface CollaborationState {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  participants: string[];
  currentUser: {
    id: string;
    cursor?: { x: number; y: number };
    selection?: string[];
    activeElement?: string;
  };
  conflicts: Array<{
    id: string;
    type: string;
    elementId: string;
    users: string[];
    timestamp: Date;
  }>;
}

export interface CollaborationEvents {
  'user-joined': { userId: string; userData: any };
  'user-left': { userId: string };
  'cursor-moved': { userId: string; position: { x: number; y: number } };
  'element-selected': { userId: string; elementId: string };
  'element-modified': { userId: string; elementId: string; changes: any };
  'chat-message': { userId: string; message: string; timestamp: Date };
  'conflict-detected': { conflictId: string; elementId: string; users: string[] };
  'conflict-resolved': { conflictId: string; resolution: any };
  'collaborators-updated': any[];
  'activity': any;
}

export type EventCallback<T = any> = (data: T) => void;

export const useCollaboration = (projectId: string, userId: string) => {
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    connectionStatus: 'disconnected',
    participants: [],
    currentUser: { id: userId },
    conflicts: []
  });

  const eventListeners = useRef<Map<string, Set<EventCallback>>>(new Map());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  // Conectar ao serviço de tempo real
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
      
      await realtimeService.connect(projectId, userId);
      await presenceManager.join(projectId, userId);
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionStatus: 'connected'
      }));
      
      reconnectAttempts.current = 0;
      reconnectDelay.current = 1000;
      
      // Configurar listeners do serviço
      setupServiceListeners();
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setState(prev => ({ ...prev, connectionStatus: 'error' }));
      handleReconnect();
    }
  }, [projectId, userId]);

  // Desconectar
  const disconnect = useCallback(async () => {
    try {
      await presenceManager.leave(projectId, userId);
      await realtimeService.disconnect();
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'disconnected'
      }));
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  }, [projectId, userId]);

  // Reconectar automaticamente
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido');
      return;
    }

    setTimeout(() => {
      reconnectAttempts.current++;
      reconnectDelay.current *= 2; // Backoff exponencial
      connect();
    }, reconnectDelay.current);
  }, [connect]);

  // Configurar listeners do serviço
  const setupServiceListeners = useCallback(() => {
    // Listener para conexão perdida
    realtimeService.onDisconnect(() => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'disconnected'
      }));
      handleReconnect();
    });

    // Listener para eventos de presença
    presenceManager.onPresenceChange((participants) => {
      setState(prev => ({ ...prev, participants }));
      emitEvent('collaborators-updated', participants);
    });

    // Listener para conflitos
    collaborationEngine.onConflict((conflict) => {
      setState(prev => ({
        ...prev,
        conflicts: [...prev.conflicts, conflict]
      }));
      emitEvent('conflict-detected', conflict);
    });

    // Listener para resolução de conflitos
    collaborationEngine.onConflictResolved((conflictId, resolution) => {
      setState(prev => ({
        ...prev,
        conflicts: prev.conflicts.filter(c => c.id !== conflictId)
      }));
      emitEvent('conflict-resolved', { conflictId, resolution });
    });
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback(<K extends keyof CollaborationEvents>(
    event: K,
    data: CollaborationEvents[K]
  ) => {
    if (!state.isConnected) {
      console.warn('Não conectado - mensagem não enviada:', event, data);
      return;
    }

    try {
      realtimeService.send(event, {
        ...data,
        userId,
        projectId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }, [state.isConnected, userId, projectId]);

  // Inscrever-se em eventos
  const subscribe = useCallback(<K extends keyof CollaborationEvents>(
    event: K,
    callback: EventCallback<CollaborationEvents[K]>
  ) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    
    eventListeners.current.get(event)!.add(callback);
    
    // Configurar listener no serviço de tempo real
    realtimeService.on(event, callback);
    
    // Retornar função de cleanup
    return () => {
      const listeners = eventListeners.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListeners.current.delete(event);
        }
      }
      realtimeService.off(event, callback);
    };
  }, []);

  // Cancelar inscrição
  const unsubscribe = useCallback(<K extends keyof CollaborationEvents>(
    event: K,
    callback?: EventCallback<CollaborationEvents[K]>
  ) => {
    if (callback) {
      const listeners = eventListeners.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        realtimeService.off(event, callback);
      }
    } else {
      // Remover todos os listeners do evento
      eventListeners.current.delete(event);
      realtimeService.offAll(event);
    }
  }, []);

  // Emitir evento local
  const emitEvent = useCallback(<K extends keyof CollaborationEvents>(
    event: K,
    data: CollaborationEvents[K]
  ) => {
    const listeners = eventListeners.current.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no callback do evento ${event}:`, error);
        }
      });
    }
  }, []);

  // Atualizar cursor
  const updateCursor = useCallback((position: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      currentUser: {
        ...prev.currentUser,
        cursor: position
      }
    }));
    
    sendMessage('cursor-moved', { userId, position });
  }, [userId, sendMessage]);

  // Selecionar elemento
  const selectElement = useCallback((elementId: string) => {
    setState(prev => ({
      ...prev,
      currentUser: {
        ...prev.currentUser,
        activeElement: elementId
      }
    }));
    
    sendMessage('element-selected', { userId, elementId });
  }, [userId, sendMessage]);

  // Modificar elemento
  const modifyElement = useCallback((elementId: string, changes: any) => {
    // Verificar conflitos antes de aplicar mudanças
    const hasConflict = state.conflicts.some(c => c.elementId === elementId);
    
    if (hasConflict) {
      console.warn('Elemento em conflito - mudança não aplicada:', elementId);
      return false;
    }
    
    // Aplicar mudanças através do engine de colaboração
    collaborationEngine.applyChange(elementId, changes, userId);
    
    sendMessage('element-modified', { userId, elementId, changes });
    return true;
  }, [state.conflicts, userId, sendMessage]);

  // Resolver conflito
  const resolveConflict = useCallback((conflictId: string, resolution: any) => {
    collaborationEngine.resolveConflict(conflictId, resolution, userId);
  }, [userId]);

  // Obter participantes online
  const getOnlineParticipants = useCallback(() => {
    return presenceManager.getParticipants(projectId);
  }, [projectId]);

  // Verificar se usuário está online
  const isUserOnline = useCallback((checkUserId: string) => {
    return state.participants.includes(checkUserId);
  }, [state.participants]);

  // Efeito para conectar/desconectar
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Efeito para cleanup de listeners
  useEffect(() => {
    return () => {
      eventListeners.current.clear();
    };
  }, []);

  return {
    // Estado
    ...state,
    
    // Métodos de conexão
    connect,
    disconnect,
    
    // Métodos de comunicação
    sendMessage,
    subscribe,
    unsubscribe,
    
    // Métodos de interação
    updateCursor,
    selectElement,
    modifyElement,
    resolveConflict,
    
    // Métodos de consulta
    getOnlineParticipants,
    isUserOnline,
    
    // Estado computado
    hasConflicts: state.conflicts.length > 0,
    participantCount: state.participants.length
  };
};

export default useCollaboration;