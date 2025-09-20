/**
 * Testes Completos para Sistema de Colaboração
 * Testa WebRTC, operações, conflitos e awareness
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import CollaborationManager, { 
  CollaborationUser, 
  CollaborationSession,
  OperationMessage,
  Comment
} from '../../lib/collaboration/CollaborationManager';

// Mock WebRTC APIs
const mockPeerConnection = {
  createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer' }),
  createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer' }),
  setLocalDescription: vi.fn().mockResolvedValue(undefined),
  setRemoteDescription: vi.fn().mockResolvedValue(undefined),
  addIceCandidate: vi.fn().mockResolvedValue(undefined),
  createDataChannel: vi.fn().mockReturnValue({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 'open'
  }),
  close: vi.fn(),
  connectionState: 'connected',
  iceConnectionState: 'connected',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN
};

// Mock global APIs
Object.defineProperty(global, 'RTCPeerConnection', {
  value: vi.fn().mockImplementation(() => mockPeerConnection),
  writable: true
});

Object.defineProperty(global, 'WebSocket', {
  value: vi.fn().mockImplementation(() => mockWebSocket),
  writable: true
});

describe('CollaborationManager', () => {
  let collaborationManager: CollaborationManager;
  let mockUser: CollaborationUser;
  let mockUser2: CollaborationUser;

  beforeEach(() => {
    vi.clearAllMocks();
    
    collaborationManager = new CollaborationManager();
    
    mockUser = {
      id: 'user-1',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      color: '#FF5733',
      role: 'editor',
      isOnline: true
    };

    mockUser2 = {
      id: 'user-2',
      name: 'Test User 2',
      avatar: 'https://example.com/avatar2.jpg',
      color: '#33FF57',
      role: 'viewer',
      isOnline: true
    };
  });

  afterEach(() => {
    collaborationManager.destroy();
  });

  describe('Inicialização de Sessão', () => {
    it('deve inicializar uma nova sessão', async () => {
      const sessionId = 'test-session-1';
      
      const session = await collaborationManager.initializeSession(sessionId, mockUser);
      
      expect(session).toBeDefined();
      expect(session.id).toBe(sessionId);
      expect(session.createdBy).toBe(mockUser.id);
      expect(session.users).toHaveLength(1);
      expect(session.users[0]).toEqual(mockUser);
    });

    it('deve emitir evento sessionInitialized', async () => {
      const listener = vi.fn();
      collaborationManager.on('sessionInitialized', listener);
      
      await collaborationManager.initializeSession('test-session', mockUser);
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-session',
          createdBy: mockUser.id
        })
      );
    });

    it('deve rejeitar inicialização com dados inválidos', async () => {
      await expect(collaborationManager.initializeSession('', mockUser))
        .rejects.toThrow('ID da sessão é obrigatório');
      
      await expect(collaborationManager.initializeSession('test-session', null as any))
        .rejects.toThrow('Dados do usuário são obrigatórios');
    });
  });

  describe('Entrada em Sessão', () => {
    beforeEach(async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
    });

    it('deve permitir entrada de novo usuário', async () => {
      const userJoinedListener = vi.fn();
      collaborationManager.on('userJoined', userJoinedListener);
      
      await collaborationManager.joinSession('test-session', mockUser2);
      
      expect(userJoinedListener).toHaveBeenCalledWith(mockUser2);
      
      const currentSession = collaborationManager.getCurrentSession();
      expect(currentSession?.users).toHaveLength(2);
    });

    it('deve estabelecer conexão WebRTC entre usuários', async () => {
      await collaborationManager.joinSession('test-session', mockUser2);
      
      // Verificar se PeerConnection foi criado
      expect(global.RTCPeerConnection).toHaveBeenCalled();
      expect(mockPeerConnection.createDataChannel).toHaveBeenCalled();
    });

    it('deve rejeitar entrada em sessão inexistente', async () => {
      await expect(collaborationManager.joinSession('nonexistent-session', mockUser2))
        .rejects.toThrow('Sessão não encontrada');
    });
  });

  describe('Operações em Tempo Real', () => {
    beforeEach(async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
      await collaborationManager.joinSession('test-session', mockUser2);
    });

    it('deve processar operação de inserção', async () => {
      const operation = {
        type: 'insert' as const,
        elementId: 'slide-1',
        data: { text: 'Hello World' },
        position: 0
      };

      const result = await collaborationManager.executeOperation(operation);
      
      expect(result.success).toBe(true);
      expect(result.operation).toMatchObject(operation);
    });

    it('deve processar operação de atualização', async () => {
      const operation = {
        type: 'update' as const,
        elementId: 'slide-1',
        data: { text: 'Updated Text' }
      };

      const result = await collaborationManager.executeOperation(operation);
      
      expect(result.success).toBe(true);
    });

    it('deve processar operação de remoção', async () => {
      const operation = {
        type: 'delete' as const,
        elementId: 'slide-1'
      };

      const result = await collaborationManager.executeOperation(operation);
      
      expect(result.success).toBe(true);
    });

    it('deve propagar operações para outros usuários', async () => {
      const operationReceivedListener = vi.fn();
      collaborationManager.on('operationReceived', operationReceivedListener);

      const operation = {
        type: 'insert' as const,
        elementId: 'slide-1',
        data: { text: 'Hello' },
        position: 0
      };

      await collaborationManager.executeOperation(operation);

      // Simular recebimento da operação
      const operationMessage: OperationMessage = {
        id: 'op-1',
        sessionId: 'test-session',
        userId: mockUser.id,
        operation,
        timestamp: new Date(),
        vectorClock: new Map([['user-1', 1]])
      };

      collaborationManager['handleOperationMessage'](operationMessage);
      
      expect(operationReceivedListener).toHaveBeenCalledWith(operationMessage);
    });
  });

  describe('Detecção e Resolução de Conflitos', () => {
    beforeEach(async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
      await collaborationManager.joinSession('test-session', mockUser2);
    });

    it('deve detectar conflitos concorrentes', async () => {
      const conflictListener = vi.fn();
      collaborationManager.on('conflictDetected', conflictListener);

      // Operações conflitantes simultâneas no mesmo elemento
      const operation1 = {
        type: 'update' as const,
        elementId: 'slide-1',
        data: { text: 'Version A' }
      };

      const operation2 = {
        type: 'update' as const,
        elementId: 'slide-1',
        data: { text: 'Version B' }
      };

      // Executar operações com timestamps muito próximos
      const timestamp = new Date();
      
      const message1: OperationMessage = {
        id: 'op-1',
        sessionId: 'test-session',
        userId: mockUser.id,
        operation: operation1,
        timestamp,
        vectorClock: new Map([['user-1', 1]])
      };

      const message2: OperationMessage = {
        id: 'op-2',
        sessionId: 'test-session',
        userId: mockUser2.id,
        operation: operation2,
        timestamp: new Date(timestamp.getTime() + 10), // 10ms diferença
        vectorClock: new Map([['user-2', 1]])
      };

      // Simular detecção de conflito
      collaborationManager['detectConflicts'](message1, [message2]);
      
      expect(conflictListener).toHaveBeenCalled();
    });

    it('deve resolver conflitos usando timestamp', () => {
      const earlier = new Date('2024-01-01T10:00:00Z');
      const later = new Date('2024-01-01T10:00:01Z');

      const operation1: OperationMessage = {
        id: 'op-1',
        sessionId: 'test-session',
        userId: mockUser.id,
        operation: { type: 'update', elementId: 'slide-1', data: { text: 'A' } },
        timestamp: later,
        vectorClock: new Map([['user-1', 1]])
      };

      const operation2: OperationMessage = {
        id: 'op-2',
        sessionId: 'test-session',
        userId: mockUser2.id,
        operation: { type: 'update', elementId: 'slide-1', data: { text: 'B' } },
        timestamp: earlier,
        vectorClock: new Map([['user-2', 1]])
      };

      const resolved = collaborationManager['resolveConflictByTimestamp']([operation1, operation2]);
      
      expect(resolved.timestamp).toEqual(earlier);
      expect(resolved.userId).toBe(mockUser2.id);
    });

    it('deve resolver conflitos usando prioridade de usuário', () => {
      const creatorOperation: OperationMessage = {
        id: 'op-1',
        sessionId: 'test-session',
        userId: mockUser.id, // criador da sessão
        operation: { type: 'update', elementId: 'slide-1', data: { text: 'Creator' } },
        timestamp: new Date(),
        vectorClock: new Map([['user-1', 1]])
      };

      const userOperation: OperationMessage = {
        id: 'op-2',
        sessionId: 'test-session',
        userId: mockUser2.id,
        operation: { type: 'update', elementId: 'slide-1', data: { text: 'User' } },
        timestamp: new Date(),
        vectorClock: new Map([['user-2', 1]])
      };

      const resolved = collaborationManager['resolveConflictByUserPriority']([creatorOperation, userOperation]);
      
      expect(resolved.userId).toBe(mockUser.id);
    });
  });

  describe('Sistema de Awareness', () => {
    beforeEach(async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
    });

    it('deve atualizar posição do cursor', async () => {
      const awarenessListener = vi.fn();
      collaborationManager.on('userAwarenessUpdate', awarenessListener);

      const cursor = { x: 100, y: 200, elementId: 'slide-1' };
      
      await collaborationManager.updateCursor(cursor);
      
      expect(awarenessListener).toHaveBeenCalledWith({
        user: mockUser,
        message: {
          type: 'cursor',
          data: cursor
        }
      });
    });

    it('deve atualizar seleção do usuário', async () => {
      const awarenessListener = vi.fn();
      collaborationManager.on('userAwarenessUpdate', awarenessListener);

      const selection = { elementId: 'slide-1', range: { start: 0, end: 10 } };
      
      await collaborationManager.updateSelection(selection);
      
      expect(awarenessListener).toHaveBeenCalledWith({
        user: mockUser,
        message: {
          type: 'selection',
          data: selection
        }
      });
    });

    it('deve atualizar atividade do usuário', async () => {
      const awarenessListener = vi.fn();
      collaborationManager.on('userAwarenessUpdate', awarenessListener);

      const activity = 'Editando slide 1';
      
      await collaborationManager.updatePresence(activity);
      
      expect(awarenessListener).toHaveBeenCalledWith({
        user: mockUser,
        message: {
          type: 'activity',
          data: { activity, timestamp: expect.any(Date) }
        }
      });
    });
  });

  describe('Sistema de Comentários', () => {
    beforeEach(async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
    });

    it('deve adicionar comentário', async () => {
      const commentData = {
        userId: mockUser.id,
        content: 'Este é um teste',
        status: 'open' as const,
        mentions: ['user-2']
      };

      const comment = await collaborationManager.addComment(commentData);
      
      expect(comment).toMatchObject({
        userId: mockUser.id,
        content: 'Este é um teste',
        status: 'open',
        mentions: ['user-2']
      });
      expect(comment.id).toBeDefined();
      expect(comment.createdAt).toBeInstanceOf(Date);
    });

    it('deve responder a comentário', async () => {
      const comment = await collaborationManager.addComment({
        userId: mockUser.id,
        content: 'Comentário original',
        status: 'open',
        mentions: []
      });

      const reply = await collaborationManager.replyToComment(comment.id, 'Esta é uma resposta');
      
      expect(reply).toMatchObject({
        id: expect.any(String),
        userId: mockUser.id,
        content: 'Esta é uma resposta',
        createdAt: expect.any(Date)
      });

      const updatedComment = collaborationManager['comments'].get(comment.id);
      expect(updatedComment?.replies).toHaveLength(1);
    });

    it('deve resolver comentário', async () => {
      const comment = await collaborationManager.addComment({
        userId: mockUser.id,
        content: 'Comentário para resolver',
        status: 'open',
        mentions: []
      });

      await collaborationManager.resolveComment(comment.id);
      
      const resolvedComment = collaborationManager['comments'].get(comment.id);
      expect(resolvedComment?.status).toBe('resolved');
    });

    it('deve rejeitar resposta a comentário inexistente', async () => {
      await expect(collaborationManager.replyToComment('nonexistent', 'resposta'))
        .rejects.toThrow('Comentário não encontrado');
    });
  });

  describe('Bloqueio de Elementos', () => {
    beforeEach(async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
      await collaborationManager.joinSession('test-session', mockUser2);
    });

    it('deve bloquear elemento para edição', async () => {
      const result = await collaborationManager.lockElement('slide-1');
      
      expect(result).toBe(true);
      expect(collaborationManager.isElementLocked('slide-1')).toBe(true);
      expect(collaborationManager.getElementLockOwner('slide-1')).toBe(mockUser.id);
    });

    it('deve rejeitar bloqueio de elemento já bloqueado', async () => {
      await collaborationManager.lockElement('slide-1');
      
      // Simular tentativa de bloqueio por outro usuário
      const collaborationManager2 = new CollaborationManager();
      await collaborationManager2.initializeSession('test-session-2', mockUser2);
      
      const result = await collaborationManager2.lockElement('slide-1');
      expect(result).toBe(false);
    });

    it('deve desbloquear elemento', async () => {
      await collaborationManager.lockElement('slide-1');
      
      const result = await collaborationManager.unlockElement('slide-1');
      
      expect(result).toBe(true);
      expect(collaborationManager.isElementLocked('slide-1')).toBe(false);
    });

    it('deve auto-desbloquear elemento após timeout', (done) => {
      const LOCK_TIMEOUT = 100; // 100ms para teste
      collaborationManager['ELEMENT_LOCK_TIMEOUT'] = LOCK_TIMEOUT;
      
      collaborationManager.lockElement('slide-1');
      
      setTimeout(() => {
        expect(collaborationManager.isElementLocked('slide-1')).toBe(false);
        done();
      }, LOCK_TIMEOUT + 10);
    });
  });

  describe('Versionamento e Histórico', () => {
    beforeEach(async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
    });

    it('deve criar snapshot de versão', async () => {
      const documentState = { slides: [{ id: 'slide-1', content: 'Test' }] };
      
      const version = await collaborationManager.createVersion(documentState, 'Versão inicial');
      
      expect(version).toMatchObject({
        id: expect.any(String),
        documentState,
        description: 'Versão inicial',
        createdBy: mockUser.id,
        createdAt: expect.any(Date)
      });
    });

    it('deve listar histórico de versões', async () => {
      const state1 = { slides: [{ id: 'slide-1', content: 'V1' }] };
      const state2 = { slides: [{ id: 'slide-1', content: 'V2' }] };
      
      await collaborationManager.createVersion(state1, 'Versão 1');
      await collaborationManager.createVersion(state2, 'Versão 2');
      
      const history = collaborationManager.getVersionHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].description).toBe('Versão 2'); // mais recente primeiro
      expect(history[1].description).toBe('Versão 1');
    });

    it('deve restaurar versão específica', async () => {
      const originalState = { slides: [{ id: 'slide-1', content: 'Original' }] };
      const modifiedState = { slides: [{ id: 'slide-1', content: 'Modified' }] };
      
      const version = await collaborationManager.createVersion(originalState, 'Original');
      await collaborationManager.createVersion(modifiedState, 'Modified');
      
      const restoredState = await collaborationManager.restoreVersion(version.id);
      
      expect(restoredState).toEqual(originalState);
    });
  });

  describe('Limpeza e Destruição', () => {
    it('deve deixar sessão corretamente', async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
      
      const userLeftListener = vi.fn();
      collaborationManager.on('userLeft', userLeftListener);
      
      await collaborationManager.leaveSession();
      
      expect(collaborationManager.getCurrentSession()).toBeNull();
      expect(userLeftListener).toHaveBeenCalledWith(mockUser.id);
    });

    it('deve limpar recursos na destruição', () => {
      collaborationManager.destroy();
      
      expect(mockPeerConnection.close).toHaveBeenCalled();
      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro de conexão WebRTC', async () => {
      const errorListener = vi.fn();
      collaborationManager.on('connectionError', errorListener);
      
      // Simular erro de conexão
      mockPeerConnection.createOffer.mockRejectedValueOnce(new Error('Connection failed'));
      
      await collaborationManager.initializeSession('test-session', mockUser);
      
      try {
        await collaborationManager.joinSession('test-session', mockUser2);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('deve tratar operação inválida', async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
      
      const operationErrorListener = vi.fn();
      collaborationManager.on('operationError', operationErrorListener);
      
      const invalidOperation = {
        type: 'invalid' as any,
        elementId: '',
        data: null
      };
      
      const result = await collaborationManager.executeOperation(invalidOperation);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve validar dados de entrada', async () => {
      await expect(collaborationManager.addComment({
        userId: '',
        content: '',
        status: 'open',
        mentions: []
      })).rejects.toThrow('Dados do comentário são inválidos');
    });
  });

  describe('Performance e Otimização', () => {
    it('deve limitar operações por segundo', async () => {
      await collaborationManager.initializeSession('test-session', mockUser);
      
      const operations = Array.from({ length: 100 }, (_, i) => ({
        type: 'update' as const,
        elementId: `element-${i}`,
        data: { value: i }
      }));
      
      const startTime = Date.now();
      
      // Executar muitas operações rapidamente
      const results = await Promise.all(
        operations.map(op => collaborationManager.executeOperation(op))
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verificar que nem todas foram processadas instantaneamente (rate limiting)
      expect(duration).toBeGreaterThan(100); // Pelo menos 100ms
      expect(results.every(r => r.success)).toBe(true);
    });

    it('deve comprimir dados grandes para transmissão', () => {
      const largeData = {
        type: 'update' as const,
        elementId: 'slide-1',
        data: {
          content: 'x'.repeat(10000) // 10KB de dados
        }
      };
      
      const compressed = collaborationManager['compressData'](largeData);
      const decompressed = collaborationManager['decompressData'](compressed);
      
      expect(compressed.length).toBeLessThan(JSON.stringify(largeData).length);
      expect(decompressed).toEqual(largeData);
    });
  });
});

// Testes de Integração
describe('Integração Completa do Sistema de Colaboração', () => {
  let manager1: CollaborationManager;
  let manager2: CollaborationManager;
  let user1: CollaborationUser;
  let user2: CollaborationUser;

  beforeEach(async () => {
    manager1 = new CollaborationManager();
    manager2 = new CollaborationManager();
    
    user1 = {
      id: 'user-1',
      name: 'Alice',
      avatar: 'alice.jpg',
      color: '#FF5733',
      role: 'editor',
      isOnline: true
    };

    user2 = {
      id: 'user-2',
      name: 'Bob',
      avatar: 'bob.jpg',
      color: '#33FF57',
      role: 'viewer',
      isOnline: true
    };
  });

  afterEach(() => {
    manager1.destroy();
    manager2.destroy();
  });

  it('deve realizar fluxo completo de colaboração', async () => {
    // 1. Alice cria sessão
    const session = await manager1.initializeSession('integration-test', user1);
    expect(session.users).toHaveLength(1);

    // 2. Bob entra na sessão
    await manager2.joinSession('integration-test', user2);
    
    // 3. Alice executa operação
    const operation = {
      type: 'insert' as const,
      elementId: 'slide-1',
      data: { text: 'Hello from Alice' },
      position: 0
    };

    const result = await manager1.executeOperation(operation);
    expect(result.success).toBe(true);

    // 4. Alice adiciona comentário
    const comment = await manager1.addComment({
      userId: user1.id,
      content: 'Precisa revisar este slide @Bob',
      status: 'open',
      mentions: ['Bob']
    });
    expect(comment.mentions).toContain('Bob');

    // 5. Bob responde ao comentário
    const reply = await manager2.replyToComment(comment.id, 'Concordo, vou ajustar');
    expect(reply.content).toBe('Concordo, vou ajustar');

    // 6. Alice resolve comentário
    await manager1.resolveComment(comment.id);

    // 7. Alice cria versão
    const version = await manager1.createVersion(
      { slides: [{ id: 'slide-1', content: 'Final version' }] },
      'Versão final colaborativa'
    );
    expect(version.description).toBe('Versão final colaborativa');

    // Verificar estado final
    const finalSession = manager1.getCurrentSession();
    expect(finalSession?.users).toHaveLength(2);
  });

  it('deve sincronizar awareness entre usuários', async () => {
    await manager1.initializeSession('awareness-test', user1);
    await manager2.joinSession('awareness-test', user2);

    const awarenessUpdates: any[] = [];
    
    manager2.on('userAwarenessUpdate', (update) => {
      awarenessUpdates.push(update);
    });

    // Alice move cursor
    await manager1.updateCursor({ x: 100, y: 200, elementId: 'slide-1' });
    
    // Alice seleciona elemento
    await manager1.updateSelection({ elementId: 'slide-1', range: { start: 0, end: 5 } });
    
    // Alice atualiza atividade
    await manager1.updatePresence('Editando título');

    // Verificar que Bob recebeu todas as atualizações
    expect(awarenessUpdates).toHaveLength(3);
    expect(awarenessUpdates[0].message.type).toBe('cursor');
    expect(awarenessUpdates[1].message.type).toBe('selection');
    expect(awarenessUpdates[2].message.type).toBe('activity');
  });
});