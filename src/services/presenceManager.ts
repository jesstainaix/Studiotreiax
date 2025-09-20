import { EventEmitter } from '../utils/EventEmitter';

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentActivity?: {
    type: 'editing' | 'viewing' | 'commenting' | 'idle';
    elementId?: string;
    description?: string;
  };
  cursor?: {
    x: number;
    y: number;
    elementId?: string;
    visible: boolean;
  };
  selection?: {
    elementIds: string[];
    type: 'single' | 'multiple' | 'range';
  };
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canView: boolean;
    role: 'owner' | 'editor' | 'viewer' | 'commenter';
  };
}

export interface PresenceEvent {
  type: 'join' | 'leave' | 'update' | 'cursor_move' | 'selection_change' | 'activity_change';
  userId: string;
  timestamp: Date;
  data?: any;
}

export interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  elementId?: string;
  color: string;
  visible: boolean;
  timestamp: Date;
}

export interface ActivityIndicator {
  userId: string;
  type: 'typing' | 'editing' | 'selecting' | 'dragging' | 'resizing';
  elementId?: string;
  startTime: Date;
  duration?: number;
  metadata?: any;
}

class PresenceManager extends EventEmitter {
  private users: Map<string, UserPresence> = new Map();
  private cursors: Map<string, CursorPosition> = new Map();
  private activities: Map<string, ActivityIndicator> = new Map();
  private heartbeatInterval = 30000; // 30 segundos
  private awayTimeout = 300000; // 5 minutos
  private offlineTimeout = 600000; // 10 minutos
  private cursorUpdateThrottle = 100; // 100ms
  private lastCursorUpdate: Map<string, number> = new Map();
  private colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  constructor() {
    super();
    this.startHeartbeat();
    this.startActivityCleanup();
  }

  // Adicionar usuário
  addUser(user: Omit<UserPresence, 'lastSeen' | 'cursor' | 'selection'>): void {
    const presence: UserPresence = {
      ...user,
      lastSeen: new Date(),
      cursor: {
        x: 0,
        y: 0,
        visible: false
      },
      selection: {
        elementIds: [],
        type: 'single'
      }
    };

    this.users.set(user.userId, presence);
    
    // Atribuir cor do cursor
    const cursorColor = this.assignCursorColor(user.userId);
    this.cursors.set(user.userId, {
      userId: user.userId,
      x: 0,
      y: 0,
      color: cursorColor,
      visible: false,
      timestamp: new Date()
    });

    this.emitPresenceEvent({
      type: 'join',
      userId: user.userId,
      timestamp: new Date(),
      data: presence
    });

    this.emit('user-joined', presence);
  }

  // Remover usuário
  removeUser(userId: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    this.users.delete(userId);
    this.cursors.delete(userId);
    this.activities.delete(userId);
    this.lastCursorUpdate.delete(userId);

    this.emitPresenceEvent({
      type: 'leave',
      userId,
      timestamp: new Date(),
      data: user
    });

    this.emit('user-left', user);
  }

  // Atualizar status do usuário
  updateUserStatus(userId: string, status: UserPresence['status']): void {
    const user = this.users.get(userId);
    if (!user) return;

    const oldStatus = user.status;
    user.status = status;
    user.lastSeen = new Date();

    this.users.set(userId, user);

    this.emitPresenceEvent({
      type: 'update',
      userId,
      timestamp: new Date(),
      data: { oldStatus, newStatus: status }
    });

    this.emit('user-status-changed', userId, status, oldStatus);
  }

  // Atualizar atividade do usuário
  updateUserActivity(userId: string, activity: UserPresence['currentActivity']): void {
    const user = this.users.get(userId);
    if (!user) return;

    const oldActivity = user.currentActivity;
    if (activity) {
      user.currentActivity = activity;
    } else {
      // Remover a propriedade para evitar atribuição de undefined
      if ('currentActivity' in user) {
        delete (user as any).currentActivity;
      }
    }
    user.lastSeen = new Date();

    this.users.set(userId, user);

    // Atualizar indicador de atividade
    if (activity) {
      const indicator: ActivityIndicator = {
        userId,
        type: activity.type as any,
        startTime: new Date(),
        ...(activity.elementId !== undefined ? { elementId: activity.elementId } : {}),
        metadata: activity
      };
      this.activities.set(userId, indicator);
    } else {
      this.activities.delete(userId);
    }

    this.emitPresenceEvent({
      type: 'activity_change',
      userId,
      timestamp: new Date(),
      data: { oldActivity, newActivity: activity }
    });

    this.emit('user-activity-changed', userId, activity, oldActivity);
  }

  // Atualizar posição do cursor
  updateCursor(userId: string, x: number, y: number, elementId?: string): void {
    const now = Date.now();
    const lastUpdate = this.lastCursorUpdate.get(userId) || 0;
    
    // Throttle de atualizações do cursor
    if (now - lastUpdate < this.cursorUpdateThrottle) {
      return;
    }

    const cursor = this.cursors.get(userId);
    if (!cursor) return;

    cursor.x = x;
    cursor.y = y;
    if (elementId !== undefined) {
      cursor.elementId = elementId;
    } else if ('elementId' in cursor) {
      delete (cursor as any).elementId;
    }
    cursor.visible = true;
    cursor.timestamp = new Date();

    this.cursors.set(userId, cursor);
    this.lastCursorUpdate.set(userId, now);

    // Atualizar heartbeat do usuário
    this.updateHeartbeat(userId);

    this.emitPresenceEvent({
      type: 'cursor_move',
      userId,
      timestamp: new Date(),
      data: { x, y, elementId }
    });

    this.emit('cursor-moved', userId, cursor);
  }

  // Ocultar cursor
  hideCursor(userId: string): void {
    const cursor = this.cursors.get(userId);
    if (!cursor) return;

    cursor.visible = false;
    cursor.timestamp = new Date();

    this.cursors.set(userId, cursor);
    this.emit('cursor-hidden', userId);
  }

  // Atualizar seleção do usuário
  updateSelection(userId: string, elementIds: string[], type: 'single' | 'multiple' | 'range' = 'single'): void {
    const user = this.users.get(userId);
    if (!user) return;

    const oldSelection = user.selection;
    user.selection = { elementIds, type };
    user.lastSeen = new Date();

    this.users.set(userId, user);

    this.emitPresenceEvent({
      type: 'selection_change',
      userId,
      timestamp: new Date(),
      data: { oldSelection, newSelection: user.selection }
    });

    this.emit('selection-changed', userId, user.selection, oldSelection);
  }

  // Atualizar heartbeat
  updateHeartbeat(userId: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    user.lastSeen = new Date();
    
    // Se estava offline/away, marcar como online
    if (user.status === 'offline' || user.status === 'away') {
      this.updateUserStatus(userId, 'online');
    }

    this.users.set(userId, user);
  }

  // Iniciar heartbeat automático
  private startHeartbeat(): void {
    setInterval(() => {
      this.checkUserActivity();
    }, this.heartbeatInterval);
  }

  // Verificar atividade dos usuários
  private checkUserActivity(): void {
    const now = new Date();
    
    this.users.forEach((user, userId) => {
      const timeSinceLastSeen = now.getTime() - user.lastSeen.getTime();
      
      if (timeSinceLastSeen > this.offlineTimeout && user.status !== 'offline') {
        this.updateUserStatus(userId, 'offline');
      } else if (timeSinceLastSeen > this.awayTimeout && user.status === 'online') {
        this.updateUserStatus(userId, 'away');
      }
    });
  }

  // Iniciar limpeza de atividades
  private startActivityCleanup(): void {
    setInterval(() => {
      this.cleanupOldActivities();
    }, 60000); // 1 minuto
  }

  // Limpar atividades antigas
  private cleanupOldActivities(): void {
    const now = new Date();
    const maxAge = 300000; // 5 minutos
    
    this.activities.forEach((activity, userId) => {
      if (now.getTime() - activity.startTime.getTime() > maxAge) {
        this.activities.delete(userId);
        
        // Atualizar atividade do usuário
        const user = this.users.get(userId);
        if (user && user.currentActivity) {
          // Remover a propriedade ao invés de setar undefined
          delete (user as any).currentActivity;
          this.users.set(userId, user);
        }
      }
    });
  }

  // Atribuir cor do cursor
  private assignCursorColor(userId: string): string {
    // Cálculo determinístico baseado no userId para evitar aviso de parâmetro não usado
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    }
    const index = hash % this.colors.length;
    return this.colors[index] ?? '#4ECDC4';
  }

  // Emitir evento de presença
  private emitPresenceEvent(event: PresenceEvent): void {
    this.emit('presence-event', event);
  }

  // Métodos de consulta
  getUser(userId: string): UserPresence | undefined {
    return this.users.get(userId);
  }

  getAllUsers(): UserPresence[] {
    return Array.from(this.users.values());
  }

  getOnlineUsers(): UserPresence[] {
    return Array.from(this.users.values()).filter(u => u.status === 'online');
  }

  getUsersByStatus(status: UserPresence['status']): UserPresence[] {
    return Array.from(this.users.values()).filter(u => u.status === status);
  }

  getCursor(userId: string): CursorPosition | undefined {
    return this.cursors.get(userId);
  }

  getAllCursors(): CursorPosition[] {
    return Array.from(this.cursors.values()).filter(c => c.visible);
  }

  getCursorsInElement(elementId: string): CursorPosition[] {
    return Array.from(this.cursors.values())
      .filter(c => c.visible && c.elementId === elementId);
  }

  getUsersEditingElement(elementId: string): UserPresence[] {
    return Array.from(this.users.values())
      .filter(u => 
        u.currentActivity?.elementId === elementId && 
        u.currentActivity.type === 'editing'
      );
  }

  getUsersViewingElement(elementId: string): UserPresence[] {
    return Array.from(this.users.values())
      .filter(u => 
        u.selection?.elementIds.includes(elementId) ||
        u.cursor?.elementId === elementId
      );
  }

  getActivity(userId: string): ActivityIndicator | undefined {
    return this.activities.get(userId);
  }

  getAllActivities(): ActivityIndicator[] {
    return Array.from(this.activities.values());
  }

  getActivitiesByType(type: ActivityIndicator['type']): ActivityIndicator[] {
    return Array.from(this.activities.values()).filter(a => a.type === type);
  }

  // Métodos de estatísticas
  getPresenceStats(): {
    total: number;
    online: number;
    away: number;
    busy: number;
    offline: number;
    activeEditors: number;
    activeViewers: number;
  } {
    const users = Array.from(this.users.values());
    
    return {
      total: users.length,
      online: users.filter(u => u.status === 'online').length,
      away: users.filter(u => u.status === 'away').length,
      busy: users.filter(u => u.status === 'busy').length,
      offline: users.filter(u => u.status === 'offline').length,
      activeEditors: users.filter(u => u.currentActivity?.type === 'editing').length,
      activeViewers: users.filter(u => u.currentActivity?.type === 'viewing').length
    };
  }

  // Métodos de notificação
  notifyUserJoined(userId: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    this.emit('notification', {
      type: 'user-joined',
      title: 'Participante conectado',
      message: `${user.username} ingressou na sessão.`,
      userId,
      timestamp: new Date()
    });
  }

  notifyUserLeft(userId: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    this.emit('notification', {
      type: 'user-left',
      title: 'Participante desconectado',
      message: `${user.username} saiu da sessão.`,
      userId,
      timestamp: new Date()
    });
  }

  // Métodos de configuração
  setHeartbeatInterval(interval: number): void {
    this.heartbeatInterval = Math.max(interval, 5000); // Mínimo 5 segundos
  }

  setAwayTimeout(timeout: number): void {
    this.awayTimeout = Math.max(timeout, 60000); // Mínimo 1 minuto
  }

  setOfflineTimeout(timeout: number): void {
    this.offlineTimeout = Math.max(timeout, 120000); // Mínimo 2 minutos
  }

  setCursorUpdateThrottle(throttle: number): void {
    this.cursorUpdateThrottle = Math.max(throttle, 50); // Mínimo 50ms
  }

  // Métodos de exportação/importação
  exportPresenceData(): {
    users: UserPresence[];
    cursors: CursorPosition[];
    activities: ActivityIndicator[];
    timestamp: Date;
  } {
    return {
      users: Array.from(this.users.values()),
      cursors: Array.from(this.cursors.values()),
      activities: Array.from(this.activities.values()),
      timestamp: new Date()
    };
  }

  importPresenceData(data: {
    users: UserPresence[];
    cursors: CursorPosition[];
    activities: ActivityIndicator[];
  }): void {
    // Limpar dados existentes
    this.users.clear();
    this.cursors.clear();
    this.activities.clear();

    // Importar usuários
    data.users.forEach(user => {
      this.users.set(user.userId, user);
    });

    // Importar cursors
    data.cursors.forEach(cursor => {
      this.cursors.set(cursor.userId, cursor);
    });

    // Importar atividades
    data.activities.forEach(activity => {
      this.activities.set(activity.userId, activity);
    });

    this.emit('presence-data-imported', data);
  }

  // Eventos
  onUserJoined(callback: (user: UserPresence) => void): void {
    this.on('user-joined', callback);
  }

  onUserLeft(callback: (user: UserPresence) => void): void {
    this.on('user-left', callback);
  }

  onUserStatusChanged(callback: (userId: string, newStatus: string, oldStatus: string) => void): void {
    this.on('user-status-changed', callback);
  }

  onCursorMoved(callback: (userId: string, cursor: CursorPosition) => void): void {
    this.on('cursor-moved', callback);
  }

  onSelectionChanged(callback: (userId: string, newSelection: any, oldSelection: any) => void): void {
    this.on('selection-changed', callback);
  }

  onActivityChanged(callback: (userId: string, newActivity: any, oldActivity: any) => void): void {
    this.on('user-activity-changed', callback);
  }

  onPresenceEvent(callback: (event: PresenceEvent) => void): void {
    this.on('presence-event', callback);
  }

  onNotification(callback: (notification: any) => void): void {
    this.on('notification', callback);
  }
}

// Instância singleton
export const presenceManager = new PresenceManager();

export default presenceManager;