import { EventEmitter } from '../utils/EventEmitter';
import { conflictResolver } from './conflictResolver';

export interface Change {
  id: string;
  elementId: string;
  userId: string;
  timestamp: Date;
  type: 'create' | 'update' | 'delete' | 'move' | 'resize';
  data: any;
  previousData?: any;
  version: number;
}

export interface Conflict {
  id: string;
  type: 'concurrent_edit' | 'version_mismatch' | 'element_deleted' | 'permission_denied';
  elementId: string;
  users: string[];
  changes: Change[];
  timestamp: Date;
  status: 'pending' | 'resolved' | 'ignored';
  resolution?: any;
}

export interface ElementLock {
  elementId: string;
  userId: string;
  timestamp: Date;
  expiresAt: Date;
  type: 'edit' | 'view' | 'exclusive';
}

export interface CollaborationState {
  elements: Map<string, any>;
  locks: Map<string, ElementLock>;
  changes: Change[];
  conflicts: Conflict[];
  versions: Map<string, number>;
}

class CollaborationEngine extends EventEmitter {
  private state: CollaborationState;
  private lockTimeout = 30000; // 30 segundos
  private maxChangesHistory = 1000;
  private changeBuffer: Map<string, Change[]> = new Map();
  private bufferTimeout = 500; // 500ms para agrupar mudanças

  constructor() {
    super();
    this.state = {
      elements: new Map(),
      locks: new Map(),
      changes: [],
      conflicts: [],
      versions: new Map()
    };

    // Limpar locks expirados periodicamente
    setInterval(() => this.cleanupExpiredLocks(), 10000);
  }

  // Aplicar mudança com detecção de conflitos
  applyChange(elementId: string, changeData: any, userId: string): boolean {
    try {
      // Verificar se elemento está bloqueado por outro usuário
      const lock = this.state.locks.get(elementId);
      if (lock && lock.userId !== userId && lock.expiresAt > new Date()) {
        this.emitConflict({
          id: this.generateId(),
          type: 'permission_denied',
          elementId,
          users: [userId, lock.userId],
          changes: [],
          timestamp: new Date(),
          status: 'pending'
        });
        return false;
      }

      // Obter versão atual do elemento
      const currentVersion = this.state.versions.get(elementId) || 0;
      const element = this.state.elements.get(elementId);

      // Criar mudança
      const change: Change = {
        id: this.generateId(),
        elementId,
        userId,
        timestamp: new Date(),
        type: this.determineChangeType(changeData),
        data: changeData,
        previousData: element ? { ...element } : undefined,
        version: currentVersion + 1
      };

      // Verificar conflitos concorrentes
      const conflictingChanges = this.detectConflicts(change);
      if (conflictingChanges.length > 0) {
        const conflict: Conflict = {
          id: this.generateId(),
          type: 'concurrent_edit',
          elementId,
          users: [userId, ...conflictingChanges.map(c => c.userId)],
          changes: [change, ...conflictingChanges],
          timestamp: new Date(),
          status: 'pending'
        };

        this.emitConflict(conflict);
        return false;
      }

      // Aplicar mudança
      this.applyChangeToState(change);
      this.addToBuffer(change);
      
      return true;
    } catch (error) {
      console.error('[Collaboration] Erro ao aplicar mudança:', error);
      return false;
    }
  }

  // Detectar conflitos
  private detectConflicts(change: Change): Change[] {
    const recentChanges = this.state.changes
      .filter(c => 
        c.elementId === change.elementId &&
        c.userId !== change.userId &&
        (change.timestamp.getTime() - c.timestamp.getTime()) < 5000 // 5 segundos
      );

    return recentChanges.filter(c => this.isConflicting(change, c));
  }

  // Verificar se duas mudanças conflitam
  private isConflicting(change1: Change, change2: Change): boolean {
    // Mudanças no mesmo elemento são potencialmente conflitantes
    if (change1.elementId !== change2.elementId) return false;

    // Mudanças do mesmo usuário não conflitam
    if (change1.userId === change2.userId) return false;

    // Verificar tipos de mudança conflitantes
    const conflictingTypes = [
      ['update', 'update'],
      ['delete', 'update'],
      ['delete', 'move'],
      ['delete', 'resize']
    ];

    return conflictingTypes.some(([type1, type2]) => 
      (change1.type === type1 && change2.type === type2) ||
      (change1.type === type2 && change2.type === type1)
    );
  }

  // Aplicar mudança ao estado
  private applyChangeToState(change: Change): void {
    const { elementId, data, type } = change;

    switch (type) {
      case 'create':
        this.state.elements.set(elementId, data);
        break;
        
      case 'update':
        const existing = this.state.elements.get(elementId);
        if (existing) {
          this.state.elements.set(elementId, { ...existing, ...data });
        }
        break;
        
      case 'delete':
        this.state.elements.delete(elementId);
        break;
        
      case 'move':
      case 'resize':
        const element = this.state.elements.get(elementId);
        if (element) {
          this.state.elements.set(elementId, { ...element, ...data });
        }
        break;
    }

    // Atualizar versão
    this.state.versions.set(elementId, change.version);
    
    // Adicionar ao histórico
    this.state.changes.push(change);
    
    // Limitar histórico
    if (this.state.changes.length > this.maxChangesHistory) {
      this.state.changes = this.state.changes.slice(-this.maxChangesHistory);
    }

    // Emitir evento de mudança aplicada
    this.emit('change-applied', change);
  }

  // Adicionar mudança ao buffer para agrupamento
  private addToBuffer(change: Change): void {
    const key = `${change.elementId}-${change.userId}`;
    
    if (!this.changeBuffer.has(key)) {
      this.changeBuffer.set(key, []);
    }
    
    this.changeBuffer.get(key)!.push(change);
    
    // Processar buffer após timeout
    setTimeout(() => {
      this.flushBuffer(key);
    }, this.bufferTimeout);
  }

  // Processar buffer de mudanças
  private flushBuffer(key: string): void {
    const changes = this.changeBuffer.get(key);
    if (!changes || changes.length === 0) return;
    
    // Agrupar mudanças similares
    const groupedChanges = this.groupSimilarChanges(changes);
    
    // Emitir mudanças agrupadas
    groupedChanges.forEach(group => {
      this.emit('changes-batched', group);
    });
    
    this.changeBuffer.delete(key);
  }

  // Agrupar mudanças similares
  private groupSimilarChanges(changes: Change[]): Change[][] {
    const groups: Change[][] = [];
    const processed = new Set<string>();
    
    changes.forEach(change => {
      if (processed.has(change.id)) return;
      
      const group = [change];
      processed.add(change.id);
      
      // Encontrar mudanças similares
      changes.forEach(otherChange => {
        if (processed.has(otherChange.id)) return;
        
        if (this.areSimilarChanges(change, otherChange)) {
          group.push(otherChange);
          processed.add(otherChange.id);
        }
      });
      
      groups.push(group);
    });
    
    return groups;
  }

  // Verificar se mudanças são similares
  private areSimilarChanges(change1: Change, change2: Change): boolean {
    return change1.elementId === change2.elementId &&
           change1.type === change2.type &&
           change1.userId === change2.userId;
  }

  // Bloquear elemento
  lockElement(elementId: string, userId: string, type: ElementLock['type'] = 'edit'): boolean {
    const existingLock = this.state.locks.get(elementId);
    
    // Verificar se já está bloqueado por outro usuário
    if (existingLock && existingLock.userId !== userId && existingLock.expiresAt > new Date()) {
      return false;
    }
    
    const lock: ElementLock = {
      elementId,
      userId,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.lockTimeout),
      type
    };
    
    this.state.locks.set(elementId, lock);
    this.emit('element-locked', lock);
    
    return true;
  }

  // Desbloquear elemento
  unlockElement(elementId: string, userId: string): boolean {
    const lock = this.state.locks.get(elementId);
    
    if (!lock || lock.userId !== userId) {
      return false;
    }
    
    this.state.locks.delete(elementId);
    this.emit('element-unlocked', { elementId, userId });
    
    return true;
  }

  // Resolver conflito
  resolveConflict(conflictId: string, resolution: any, userId: string): void {
    const conflict = this.state.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;
    
    // Usar o resolvedor de conflitos
    const resolvedChange = conflictResolver.resolve(conflict, resolution, userId);
    
    if (resolvedChange) {
      // Aplicar resolução
      this.applyChangeToState(resolvedChange);
      
      // Marcar conflito como resolvido
      conflict.status = 'resolved';
      conflict.resolution = resolution;
      
      this.emit('conflict-resolved', conflictId, resolution);
    }
  }

  // Limpar locks expirados
  private cleanupExpiredLocks(): void {
    const now = new Date();
    const expiredLocks: string[] = [];
    
    this.state.locks.forEach((lock, elementId) => {
      if (lock.expiresAt <= now) {
        expiredLocks.push(elementId);
      }
    });
    
    expiredLocks.forEach(elementId => {
      const lock = this.state.locks.get(elementId);
      this.state.locks.delete(elementId);
      this.emit('lock-expired', { elementId, lock });
    });
  }

  // Determinar tipo de mudança
  private determineChangeType(data: any): Change['type'] {
    if (data._isNew) return 'create';
    if (data._isDeleted) return 'delete';
    if (data.x !== undefined || data.y !== undefined) return 'move';
    if (data.width !== undefined || data.height !== undefined) return 'resize';
    return 'update';
  }

  // Emitir conflito
  private emitConflict(conflict: Conflict): void {
    this.state.conflicts.push(conflict);
    this.emit('conflict', conflict);
  }

  // Gerar ID único
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos públicos de consulta
  getElement(elementId: string): any {
    return this.state.elements.get(elementId);
  }

  getAllElements(): Map<string, any> {
    return new Map(this.state.elements);
  }

  getElementLock(elementId: string): ElementLock | undefined {
    return this.state.locks.get(elementId);
  }

  isElementLocked(elementId: string, userId?: string): boolean {
    const lock = this.state.locks.get(elementId);
    if (!lock || lock.expiresAt <= new Date()) return false;
    
    return userId ? lock.userId !== userId : true;
  }

  getConflicts(): Conflict[] {
    return [...this.state.conflicts];
  }

  getPendingConflicts(): Conflict[] {
    return this.state.conflicts.filter(c => c.status === 'pending');
  }

  getChangeHistory(elementId?: string): Change[] {
    if (elementId) {
      return this.state.changes.filter(c => c.elementId === elementId);
    }
    return [...this.state.changes];
  }

  getElementVersion(elementId: string): number {
    return this.state.versions.get(elementId) || 0;
  }

  // Métodos de sincronização
  syncState(remoteState: Partial<CollaborationState>): void {
    if (remoteState.elements) {
      remoteState.elements.forEach((element, id) => {
        const localVersion = this.state.versions.get(id) || 0;
        const remoteVersion = remoteState.versions?.get(id) || 0;
        
        if (remoteVersion > localVersion) {
          this.state.elements.set(id, element);
          this.state.versions.set(id, remoteVersion);
        }
      });
    }
    
    this.emit('state-synced', remoteState);
  }

  exportState(): CollaborationState {
    return {
      elements: new Map(this.state.elements),
      locks: new Map(this.state.locks),
      changes: [...this.state.changes],
      conflicts: [...this.state.conflicts],
      versions: new Map(this.state.versions)
    };
  }

  // Eventos
  onConflict(callback: (conflict: Conflict) => void): void {
    this.on('conflict', callback);
  }

  onConflictResolved(callback: (conflictId: string, resolution: any) => void): void {
    this.on('conflict-resolved', callback);
  }

  onElementLocked(callback: (lock: ElementLock) => void): void {
    this.on('element-locked', callback);
  }

  onElementUnlocked(callback: (data: { elementId: string; userId: string }) => void): void {
    this.on('element-unlocked', callback);
  }

  onChangeApplied(callback: (change: Change) => void): void {
    this.on('change-applied', callback);
  }
}

// Instância singleton
export const collaborationEngine = new CollaborationEngine();

export default collaborationEngine;