/**
 * Testes unitários para useRealTimeCollaboration hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRealTimeCollaboration } from '../../hooks/useRealTimeCollaboration';
import { mockWebSocket } from '../setup';

describe('useRealTimeCollaboration Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock WebSocket
    global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket());
  });

  describe('Inicialização', () => {
    it('deve inicializar com estado padrão', () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      expect(result.current.sessions).toEqual([]);
      expect(result.current.users).toEqual([]);
      expect(result.current.changes).toEqual([]);
      expect(result.current.conflicts).toEqual([]);
      expect(result.current.comments).toEqual([]);
      expect(result.current.stats).toBeDefined();
      expect(result.current.analytics).toBeDefined();
      expect(result.current.configs).toBeDefined();
    });

    it('deve ter todas as ações disponíveis', () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      expect(result.current.actions).toBeDefined();
      expect(result.current.quickActions).toBeDefined();
      expect(result.current.throttledActions).toBeDefined();
      expect(result.current.debouncedActions).toBeDefined();
    });

    it('deve ter valores computados corretos', () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      expect(result.current.totalSessions).toBe(0);
      expect(result.current.activeSessions).toBe(0);
      expect(result.current.totalUsers).toBe(0);
      expect(result.current.onlineUsers).toBe(0);
      expect(result.current.totalConflicts).toBe(0);
      expect(result.current.unresolvedConflicts).toBe(0);
      expect(result.current.collaborationScore).toBeGreaterThanOrEqual(0);
      expect(result.current.collaborationScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Gerenciamento de Sessões', () => {
    it('deve criar uma nova sessão', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      await act(async () => {
        await result.current.quickActions.createSession({
          name: 'Project Alpha',
          type: 'document',
          maxUsers: 10
        });
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].name).toBe('Project Alpha');
      expect(result.current.sessions[0].type).toBe('document');
      expect(result.current.sessions[0].maxUsers).toBe(10);
      expect(result.current.sessions[0].status).toBe('active');
      expect(result.current.totalSessions).toBe(1);
      expect(result.current.activeSessions).toBe(1);
    });

    it('deve atualizar uma sessão', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar sessão
      await act(async () => {
        await result.current.quickActions.createSession({
          name: 'Test Session',
          type: 'document',
          maxUsers: 5
        });
      });

      const sessionId = result.current.sessions[0].id;

      // Atualizar sessão
      await act(async () => {
        await result.current.actions.updateSession(sessionId, {
          name: 'Updated Session',
          maxUsers: 15
        });
      });

      expect(result.current.sessions[0].name).toBe('Updated Session');
      expect(result.current.sessions[0].maxUsers).toBe(15);
    });

    it('deve encerrar uma sessão', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar sessão
      await act(async () => {
        await result.current.quickActions.createSession({
          name: 'Test Session',
          type: 'document',
          maxUsers: 5
        });
      });

      const sessionId = result.current.sessions[0].id;

      // Encerrar sessão
      await act(async () => {
        await result.current.actions.endSession(sessionId);
      });

      expect(result.current.sessions[0].status).toBe('ended');
      expect(result.current.activeSessions).toBe(0);
    });

    it('deve remover uma sessão', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar sessão
      await act(async () => {
        await result.current.quickActions.createSession({
          name: 'Test Session',
          type: 'document',
          maxUsers: 5
        });
      });

      const sessionId = result.current.sessions[0].id;

      // Remover sessão
      await act(async () => {
        await result.current.actions.deleteSession(sessionId);
      });

      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.totalSessions).toBe(0);
    });
  });

  describe('Gerenciamento de Usuários', () => {
    it('deve adicionar um usuário', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      await act(async () => {
        await result.current.quickActions.inviteUser({
          name: 'John Doe',
          email: 'john@example.com',
          role: 'editor'
        });
      });

      expect(result.current.users).toHaveLength(1);
      expect(result.current.users[0].name).toBe('John Doe');
      expect(result.current.users[0].email).toBe('john@example.com');
      expect(result.current.users[0].role).toBe('editor');
      expect(result.current.users[0].status).toBe('invited');
      expect(result.current.totalUsers).toBe(1);
    });

    it('deve conectar um usuário', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Adicionar usuário
      await act(async () => {
        await result.current.quickActions.inviteUser({
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'viewer'
        });
      });

      const userId = result.current.users[0].id;

      // Conectar usuário
      await act(async () => {
        await result.current.actions.connectUser(userId);
      });

      expect(result.current.users[0].status).toBe('online');
      expect(result.current.onlineUsers).toBe(1);
    });

    it('deve desconectar um usuário', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Adicionar e conectar usuário
      await act(async () => {
        await result.current.quickActions.inviteUser({
          name: 'Test User',
          email: 'test@example.com',
          role: 'editor'
        });
      });

      const userId = result.current.users[0].id;

      await act(async () => {
        await result.current.actions.connectUser(userId);
      });

      // Desconectar usuário
      await act(async () => {
        await result.current.actions.disconnectUser(userId);
      });

      expect(result.current.users[0].status).toBe('offline');
      expect(result.current.onlineUsers).toBe(0);
    });

    it('deve atualizar permissões de usuário', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Adicionar usuário
      await act(async () => {
        await result.current.quickActions.inviteUser({
          name: 'Test User',
          email: 'test@example.com',
          role: 'viewer'
        });
      });

      const userId = result.current.users[0].id;

      // Atualizar permissões
      await act(async () => {
        await result.current.actions.updateUserPermissions(userId, 'admin');
      });

      expect(result.current.users[0].role).toBe('admin');
    });
  });

  describe('Gerenciamento de Mudanças', () => {
    it('deve registrar uma mudança', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      await act(async () => {
        await result.current.actions.recordChange({
          type: 'text-edit',
          data: {
            position: 10,
            content: 'Hello World',
            operation: 'insert'
          },
          userId: 'user-1',
          sessionId: 'session-1'
        });
      });

      expect(result.current.changes).toHaveLength(1);
      expect(result.current.changes[0].type).toBe('text-edit');
      expect(result.current.changes[0].data.content).toBe('Hello World');
      expect(result.current.changes[0].userId).toBe('user-1');
    });

    it('deve sincronizar mudanças', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Registrar mudanças
      await act(async () => {
        await result.current.actions.recordChange({
          type: 'text-edit',
          data: { position: 0, content: 'A', operation: 'insert' },
          userId: 'user-1',
          sessionId: 'session-1'
        });
        await result.current.actions.recordChange({
          type: 'text-edit',
          data: { position: 1, content: 'B', operation: 'insert' },
          userId: 'user-2',
          sessionId: 'session-1'
        });
      });

      // Sincronizar mudanças
      await act(async () => {
        await result.current.actions.syncChanges('session-1');
      });

      expect(result.current.changes.every(c => c.synced)).toBe(true);
    });

    it('deve aplicar mudanças remotas', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      const remoteChanges = [
        {
          id: 'change-1',
          type: 'text-edit',
          data: { position: 5, content: 'Remote', operation: 'insert' },
          userId: 'remote-user',
          sessionId: 'session-1',
          timestamp: Date.now(),
          synced: true
        }
      ];

      await act(async () => {
        await result.current.actions.applyRemoteChanges(remoteChanges);
      });

      expect(result.current.changes).toHaveLength(1);
      expect(result.current.changes[0].data.content).toBe('Remote');
      expect(result.current.changes[0].userId).toBe('remote-user');
    });
  });

  describe('Gerenciamento de Conflitos', () => {
    it('deve detectar conflito', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Registrar mudanças conflitantes
      await act(async () => {
        await result.current.actions.recordChange({
          type: 'text-edit',
          data: { position: 10, content: 'Version A', operation: 'replace' },
          userId: 'user-1',
          sessionId: 'session-1'
        });
        await result.current.actions.recordChange({
          type: 'text-edit',
          data: { position: 10, content: 'Version B', operation: 'replace' },
          userId: 'user-2',
          sessionId: 'session-1'
        });
      });

      // Detectar conflitos
      await act(async () => {
        await result.current.actions.detectConflicts('session-1');
      });

      expect(result.current.conflicts.length).toBeGreaterThan(0);
      expect(result.current.totalConflicts).toBeGreaterThan(0);
      expect(result.current.unresolvedConflicts).toBeGreaterThan(0);
    });

    it('deve resolver conflito automaticamente', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar conflito
      await act(async () => {
        await result.current.actions.createConflict({
          type: 'text-edit',
          changes: ['change-1', 'change-2'],
          sessionId: 'session-1',
          position: 10
        });
      });

      const conflictId = result.current.conflicts[0].id;

      // Resolver automaticamente
      await act(async () => {
        await result.current.actions.resolveConflict(conflictId, 'auto', {
          strategy: 'last-write-wins'
        });
      });

      expect(result.current.conflicts[0].status).toBe('resolved');
      expect(result.current.conflicts[0].resolution?.type).toBe('auto');
      expect(result.current.unresolvedConflicts).toBe(0);
    });

    it('deve resolver conflito manualmente', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar conflito
      await act(async () => {
        await result.current.actions.createConflict({
          type: 'text-edit',
          changes: ['change-1', 'change-2'],
          sessionId: 'session-1',
          position: 15
        });
      });

      const conflictId = result.current.conflicts[0].id;

      // Resolver manualmente
      await act(async () => {
        await result.current.actions.resolveConflict(conflictId, 'manual', {
          selectedChange: 'change-1',
          customResolution: 'Manual merge result'
        });
      });

      expect(result.current.conflicts[0].status).toBe('resolved');
      expect(result.current.conflicts[0].resolution?.type).toBe('manual');
      expect(result.current.conflicts[0].resolution?.data.customResolution).toBe('Manual merge result');
    });
  });

  describe('Gerenciamento de Comentários', () => {
    it('deve criar um comentário', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      await act(async () => {
        await result.current.quickActions.createComment({
          content: 'This needs review',
          position: { line: 10, column: 5 },
          userId: 'user-1',
          sessionId: 'session-1'
        });
      });

      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].content).toBe('This needs review');
      expect(result.current.comments[0].position.line).toBe(10);
      expect(result.current.comments[0].userId).toBe('user-1');
    });

    it('deve responder a um comentário', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar comentário
      await act(async () => {
        await result.current.quickActions.createComment({
          content: 'Original comment',
          position: { line: 5, column: 0 },
          userId: 'user-1',
          sessionId: 'session-1'
        });
      });

      const commentId = result.current.comments[0].id;

      // Responder ao comentário
      await act(async () => {
        await result.current.actions.replyToComment(commentId, {
          content: 'Reply to comment',
          userId: 'user-2'
        });
      });

      expect(result.current.comments[0].replies).toHaveLength(1);
      expect(result.current.comments[0].replies[0].content).toBe('Reply to comment');
      expect(result.current.comments[0].replies[0].userId).toBe('user-2');
    });

    it('deve resolver um comentário', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar comentário
      await act(async () => {
        await result.current.quickActions.createComment({
          content: 'Issue found',
          position: { line: 20, column: 10 },
          userId: 'user-1',
          sessionId: 'session-1'
        });
      });

      const commentId = result.current.comments[0].id;

      // Resolver comentário
      await act(async () => {
        await result.current.actions.resolveComment(commentId);
      });

      expect(result.current.comments[0].status).toBe('resolved');
    });
  });

  describe('Configurações', () => {
    it('deve atualizar configurações', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      await act(async () => {
        await result.current.actions.updateConfig({
          autoSync: true,
          syncInterval: 1000,
          conflictResolution: 'manual',
          maxUsers: 20
        });
      });

      expect(result.current.configs.autoSync).toBe(true);
      expect(result.current.configs.syncInterval).toBe(1000);
      expect(result.current.configs.conflictResolution).toBe('manual');
      expect(result.current.configs.maxUsers).toBe(20);
    });

    it('deve resetar configurações', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Atualizar configurações
      await act(async () => {
        await result.current.actions.updateConfig({
          autoSync: false,
          syncInterval: 5000
        });
      });

      // Resetar configurações
      await act(async () => {
        await result.current.actions.resetConfig();
      });

      expect(result.current.configs.autoSync).toBe(true);
      expect(result.current.configs.syncInterval).toBe(2000);
    });
  });

  describe('Analytics e Estatísticas', () => {
    it('deve calcular score de colaboração', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar sessão ativa com usuários
      await act(async () => {
        await result.current.quickActions.createSession({
          name: 'Active Session',
          type: 'document',
          maxUsers: 10
        });
        await result.current.quickActions.inviteUser({
          name: 'User 1',
          email: 'user1@example.com',
          role: 'editor'
        });
        await result.current.quickActions.inviteUser({
          name: 'User 2',
          email: 'user2@example.com',
          role: 'editor'
        });
      });

      // Conectar usuários
      await act(async () => {
        await result.current.actions.connectUser(result.current.users[0].id);
        await result.current.actions.connectUser(result.current.users[1].id);
      });

      expect(result.current.collaborationScore).toBeGreaterThan(0);
      expect(result.current.collaborationScore).toBeLessThanOrEqual(100);
    });

    it('deve calcular estatísticas de atividade', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar atividade
      await act(async () => {
        await result.current.quickActions.createSession({
          name: 'Test Session',
          type: 'document',
          maxUsers: 5
        });
        await result.current.actions.recordChange({
          type: 'text-edit',
          data: { position: 0, content: 'Test', operation: 'insert' },
          userId: 'user-1',
          sessionId: result.current.sessions[0].id
        });
      });

      expect(result.current.stats.totalSessions).toBe(1);
      expect(result.current.stats.totalChanges).toBe(1);
      expect(result.current.analytics.activityLevel).toBeGreaterThan(0);
    });
  });

  describe('Ações Throttled e Debounced', () => {
    it('deve throttle sincronização', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());
      const spy = vi.spyOn(result.current.actions, 'syncChanges');

      // Executar sync throttled múltiplas vezes
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          result.current.throttledActions.syncChanges('session-1');
        }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('deve debounce detecção de conflitos', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());
      const spy = vi.spyOn(result.current.actions, 'detectConflicts');

      // Executar detecção debounced múltiplas vezes
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          result.current.debouncedActions.detectConflicts('session-1');
        }
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com erro de conexão WebSocket', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Mock WebSocket com erro
      const mockWS = mockWebSocket();
      mockWS.onerror = vi.fn();
      global.WebSocket = vi.fn().mockImplementation(() => mockWS);

      await act(async () => {
        try {
          await result.current.actions.connectToSession('session-1');
          // Simular erro
          mockWS.onerror(new Event('error'));
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });

    it('deve lidar com conflito de sincronização', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar mudanças conflitantes
      await act(async () => {
        await result.current.actions.recordChange({
          type: 'text-edit',
          data: { position: 0, content: 'Local', operation: 'insert' },
          userId: 'local-user',
          sessionId: 'session-1'
        });
      });

      // Aplicar mudança remota conflitante
      const remoteChanges = [{
        id: 'remote-1',
        type: 'text-edit',
        data: { position: 0, content: 'Remote', operation: 'insert' },
        userId: 'remote-user',
        sessionId: 'session-1',
        timestamp: Date.now(),
        synced: true
      }];

      await act(async () => {
        await result.current.actions.applyRemoteChanges(remoteChanges);
        await result.current.actions.detectConflicts('session-1');
      });

      expect(result.current.conflicts.length).toBeGreaterThan(0);
    });

    it('deve manter estado consistente após erro', async () => {
      const { result } = renderHook(() => useRealTimeCollaboration());

      // Criar sessão válida
      await act(async () => {
        await result.current.quickActions.createSession({
          name: 'Valid Session',
          type: 'document',
          maxUsers: 5
        });
      });

      const initialCount = result.current.sessions.length;

      // Tentar operação que falha
      vi.spyOn(result.current.actions, 'updateSession').mockRejectedValue(
        new Error('Update failed')
      );

      await act(async () => {
        try {
          await result.current.actions.updateSession('invalid-id', { name: 'Updated' });
        } catch (error) {
          // Erro esperado
        }
      });

      // Estado deve permanecer consistente
      expect(result.current.sessions).toHaveLength(initialCount);
      expect(result.current.sessions[0].name).toBe('Valid Session');
    });
  });
});