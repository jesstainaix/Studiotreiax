import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Users, Lock, AlertTriangle, RefreshCw, Eye, Edit3, MousePointer } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { collaborationEngine, Change, Conflict } from '../../services/collaborationEngine';
import { presenceManager, CursorPosition } from '../../services/presenceManager';
import { conflictResolver, ResolutionOptions } from '../../services/conflictResolver';

interface RealtimeSyncProps {
  timelineRef: React.RefObject<HTMLDivElement>;
  onElementChange?: (elementId: string, changes: any) => void;
  onConflictDetected?: (conflict: Conflict) => void;
  onSyncComplete?: () => void;
}

interface ElementLockIndicator {
  elementId: string;
  userId: string;
  username: string;
  type: 'edit' | 'view' | 'exclusive';
  expiresAt: Date;
}

interface ConflictDialog {
  conflict: Conflict;
  visible: boolean;
  resolution?: ResolutionOptions;
}

export const RealtimeSync: React.FC<RealtimeSyncProps> = ({
  timelineRef,
  onElementChange,
  onConflictDetected,
  onSyncComplete
}) => {
  const { isConnected, currentUser, collaborators } = useCollaboration();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [locks, setLocks] = useState<ElementLockIndicator[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [conflictDialog, setConflictDialog] = useState<ConflictDialog | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'conflict' | 'error'>('idle');
  const [pendingChanges, setPendingChanges] = useState<Change[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const cursorUpdateRef = useRef<NodeJS.Timeout>();

  // Inicializar sincronização
  useEffect(() => {
    if (!isConnected || !currentUser) return;

    // Configurar listeners do collaboration engine
    collaborationEngine.onConflict(handleConflict);
    collaborationEngine.onConflictResolved(handleConflictResolved);
    collaborationEngine.onElementLocked(handleElementLocked);
    collaborationEngine.onElementUnlocked(handleElementUnlocked);
    collaborationEngine.onChangeApplied(handleChangeApplied);

    // Configurar listeners do presence manager
    presenceManager.onCursorMoved(handleCursorMoved);
    presenceManager.onUserJoined(handleUserJoined);
    presenceManager.onUserLeft(handleUserLeft);

    // Iniciar sincronização periódica
    startPeriodicSync();

    // Configurar listeners de mouse para cursor tracking
    setupCursorTracking();

    return () => {
      // Cleanup
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (cursorUpdateRef.current) {
        clearTimeout(cursorUpdateRef.current);
      }
    };
  }, [isConnected, currentUser]);

  // Configurar tracking do cursor
  const setupCursorTracking = useCallback(() => {
    if (!timelineRef.current || !currentUser) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const elementId = getElementAtPosition(x, y);

      // Throttle cursor updates
      if (cursorUpdateRef.current) {
        clearTimeout(cursorUpdateRef.current);
      }

      cursorUpdateRef.current = setTimeout(() => {
        presenceManager.updateCursor(currentUser.id, x, y, elementId);
      }, 50);
    };

    const handleMouseLeave = () => {
      presenceManager.hideCursor(currentUser.id);
    };

    timelineRef.current.addEventListener('mousemove', handleMouseMove);
    timelineRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      timelineRef.current?.removeEventListener('mousemove', handleMouseMove);
      timelineRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [timelineRef, currentUser]);

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

  // Iniciar sincronização periódica
  const startPeriodicSync = () => {
    syncIntervalRef.current = setInterval(() => {
      syncPendingChanges();
    }, 1000); // Sincronizar a cada segundo
  };

  // Sincronizar mudanças pendentes
  const syncPendingChanges = async () => {
    if (pendingChanges.length === 0) return;

    setSyncStatus('syncing');
    
    try {
      // Processar mudanças em lotes
      const batches = chunkArray(pendingChanges, 10);
      
      for (const batch of batches) {
        await processBatch(batch);
      }
      
      setPendingChanges([]);
      setLastSyncTime(new Date());
      setSyncStatus('idle');
      onSyncComplete?.();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncStatus('error');
    }
  };

  // Processar lote de mudanças
  const processBatch = async (batch: Change[]): Promise<void> => {
    return new Promise((resolve) => {
      let processed = 0;
      
      batch.forEach(change => {
        const success = collaborationEngine.applyChange(
          change.elementId,
          change.data,
          change.userId
        );
        
        if (success) {
          onElementChange?.(change.elementId, change.data);
        }
        
        processed++;
        if (processed === batch.length) {
          resolve();
        }
      });
    });
  };

  // Dividir array em chunks
  const chunkArray = (array: any[], size: number): any[][] => {
    const chunks: any[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  // Handlers de eventos
  const handleConflict = (conflict: Conflict) => {
    setConflicts(prev => [...prev, conflict]);
    setSyncStatus('conflict');
    onConflictDetected?.(conflict);
    
    // Analisar conflito e sugerir resolução automática
    const analysis = conflictResolver.analyzeConflict(conflict);
    
    if (analysis.canAutoResolve && analysis.severity === 'low') {
      // Resolver automaticamente conflitos simples
      const resolution: ResolutionOptions = {
        strategy: analysis.suggestedStrategy as any,
        mergeRules: []
      };
      
      collaborationEngine.resolveConflict(conflict.id, resolution, currentUser?.id || '');
    } else {
      // Mostrar dialog para resolução manual
      setConflictDialog({
        conflict,
        visible: true,
        resolution: {
          strategy: analysis.suggestedStrategy as any,
          mergeRules: []
        }
      });
    }
  };

  const handleConflictResolved = (conflictId: string, resolution: any) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    
    if (conflicts.length <= 1) {
      setSyncStatus('idle');
    }
    
    setConflictDialog(null);
  };

  const handleElementLocked = (lock: any) => {
    const user = collaborators.find(c => c.id === lock.userId);
    if (!user) return;
    
    setLocks(prev => [
      ...prev.filter(l => l.elementId !== lock.elementId),
      {
        elementId: lock.elementId,
        userId: lock.userId,
        username: user.username,
        type: lock.type,
        expiresAt: lock.expiresAt
      }
    ]);
  };

  const handleElementUnlocked = (data: { elementId: string; userId: string }) => {
    setLocks(prev => prev.filter(l => 
      !(l.elementId === data.elementId && l.userId === data.userId)
    ));
  };

  const handleChangeApplied = (change: Change) => {
    // Remover da lista de pendentes se existir
    setPendingChanges(prev => prev.filter(c => c.id !== change.id));
  };

  const handleCursorMoved = (userId: string, cursor: CursorPosition) => {
    setCursors(prev => [
      ...prev.filter(c => c.userId !== userId),
      cursor
    ]);
  };

  const handleUserJoined = (user: any) => {
    // Sincronizar estado atual com novo usuário
    const currentState = collaborationEngine.exportState();
    // Enviar estado via WebSocket (implementação específica)
  };

  const handleUserLeft = (user: any) => {
    // Remover cursor e locks do usuário
    setCursors(prev => prev.filter(c => c.userId !== user.userId));
    setLocks(prev => prev.filter(l => l.userId !== user.userId));
  };

  // Aplicar mudança local
  const applyLocalChange = (elementId: string, changes: any) => {
    if (!currentUser) return;
    
    const change: Change = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      elementId,
      userId: currentUser.id,
      timestamp: new Date(),
      type: 'update',
      data: changes,
      version: collaborationEngine.getElementVersion(elementId) + 1
    };
    
    setPendingChanges(prev => [...prev, change]);
    
    // Tentar aplicar imediatamente
    const success = collaborationEngine.applyChange(elementId, changes, currentUser.id);
    
    if (!success) {
      // Adicionar à fila de pendentes se falhou
      console.warn('Mudança adicionada à fila de pendentes:', change.id);
    }
  };

  // Bloquear elemento
  const lockElement = (elementId: string, type: 'edit' | 'view' | 'exclusive' = 'edit') => {
    if (!currentUser) return false;
    
    return collaborationEngine.lockElement(elementId, currentUser.id, type);
  };

  // Desbloquear elemento
  const unlockElement = (elementId: string) => {
    if (!currentUser) return false;
    
    return collaborationEngine.unlockElement(elementId, currentUser.id);
  };

  // Resolver conflito manualmente
  const resolveConflict = (conflictId: string, resolution: ResolutionOptions) => {
    if (!currentUser) return;
    
    collaborationEngine.resolveConflict(conflictId, resolution, currentUser.id);
  };

  // Renderizar cursores de outros usuários
  const renderCursors = () => {
    return cursors
      .filter(cursor => cursor.userId !== currentUser?.id && cursor.visible)
      .map(cursor => {
        const user = collaborators.find(c => c.id === cursor.userId);
        if (!user) return null;
        
        return (
          <div
            key={cursor.userId}
            className="absolute pointer-events-none z-50 transition-all duration-100"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-2px, -2px)'
            }}
          >
            <MousePointer 
              size={16} 
              style={{ color: cursor.color }}
              className="drop-shadow-sm"
            />
            <div 
              className="absolute top-4 left-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {user.username}
            </div>
          </div>
        );
      });
  };

  // Renderizar indicadores de lock
  const renderLockIndicators = () => {
    return locks.map(lock => {
      const element = timelineRef.current?.querySelector(`[data-element-id="${lock.elementId}"]`);
      if (!element) return null;
      
      const rect = element.getBoundingClientRect();
      const timelineRect = timelineRef.current?.getBoundingClientRect();
      
      if (!timelineRect) return null;
      
      const x = rect.left - timelineRect.left;
      const y = rect.top - timelineRect.top;
      
      return (
        <div
          key={`${lock.elementId}-${lock.userId}`}
          className="absolute pointer-events-none z-40"
          style={{
            left: x,
            top: y,
            width: rect.width,
            height: rect.height
          }}
        >
          <div className="absolute inset-0 border-2 border-red-400 border-dashed rounded bg-red-50 bg-opacity-20" />
          <div className="absolute -top-6 left-0 flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded">
            <Lock size={12} />
            <span>{lock.username}</span>
          </div>
        </div>
      );
    });
  };

  // Status da sincronização
  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="animate-spin" size={16} />;
      case 'conflict':
        return <AlertTriangle className="text-yellow-500" size={16} />;
      case 'error':
        return <AlertTriangle className="text-red-500" size={16} />;
      default:
        return <RefreshCw className="text-green-500" size={16} />;
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Sincronizando...';
      case 'conflict':
        return `${conflicts.length} conflito(s) detectado(s)`;
      case 'error':
        return 'Erro na sincronização';
      default:
        return 'Sincronizado';
    }
  };

  if (!isConnected) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Desconectado - Modo offline</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Status da sincronização */}
      <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
        <div className="flex items-center gap-2 text-sm">
          {getSyncStatusIcon()}
          <span>{getSyncStatusText()}</span>
        </div>
        
        {pendingChanges.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {pendingChanges.length} mudança(s) pendente(s)
          </div>
        )}
        
        <div className="text-xs text-gray-400 mt-1">
          Última sync: {lastSyncTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Cursores de outros usuários */}
      {timelineRef.current && (
        <div className="absolute inset-0 pointer-events-none">
          {renderCursors()}
        </div>
      )}

      {/* Indicadores de elementos bloqueados */}
      {timelineRef.current && (
        <div className="absolute inset-0 pointer-events-none">
          {renderLockIndicators()}
        </div>
      )}

      {/* Dialog de resolução de conflitos */}
      {conflictDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-yellow-500" size={24} />
                <h3 className="text-lg font-semibold">Conflito Detectado</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Múltiplos usuários editaram o mesmo elemento simultaneamente.
                </p>
                
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-medium mb-2">Usuários envolvidos:</div>
                  <div className="flex gap-2">
                    {conflictDialog.conflict.users.map(userId => {
                      const user = collaborators.find(c => c.id === userId);
                      return (
                        <span key={userId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {user?.username || userId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (conflictDialog.resolution) {
                      resolveConflict(conflictDialog.conflict.id, conflictDialog.resolution);
                    }
                  }}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Resolver Automaticamente
                </button>
                
                <button
                  onClick={() => setConflictDialog(null)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Resolver Manualmente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RealtimeSync;