// Custom EventEmitter implementation for browser compatibility
class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    return this;
  }

  off(event: string, listener: Function): this {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}

export interface RealtimeMessage {
  id: string;
  type: string;
  data: any;
  userId: string;
  projectId: string;
  timestamp: Date;
}

export interface ConnectionOptions {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

class RealtimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private projectId: string | null = null;
  private userId: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: RealtimeMessage[] = [];
  private connectionPromise: Promise<void> | null = null;

  constructor(private options: ConnectionOptions = {}) {
    super();
    this.maxReconnectAttempts = options.reconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
  }

  async connect(projectId: string, userId: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.projectId = projectId;
    this.userId = userId;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Simular WebSocket para desenvolvimento
        // Em produção, usar: new WebSocket(`wss://api.example.com/ws/${projectId}?userId=${userId}`)
  this.ws = this.createMockWebSocket();

        this.ws.onopen = () => {
          console.log('[Realtime] Conexão estabelecida');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: RealtimeMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[Realtime] Erro ao processar mensagem:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[Realtime] Conexão encerrada:', event.code, event.reason);
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[Realtime] Erro na conexão WebSocket:', error);
          this.emit('error', error);
          reject(error);
        };

        // Timeout para conexão
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Timeout na conexão'));
          }
        }, this.options.timeout || 10000);

      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.isConnected = false;
      this.stopHeartbeat();
      this.ws.close(1000, 'Desconexão solicitada');
      this.ws = null;
    }
    this.connectionPromise = null;
    this.emit('disconnected');
  }

  send<T = any>(type: string, data: T): void {
    const message: RealtimeMessage = {
      id: this.generateId(),
      type,
      data,
      userId: this.userId!,
      projectId: this.projectId!,
      timestamp: new Date()
    };

    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[Realtime] Erro ao enviar mensagem:', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  offAll(event: string): void {
    this.removeAllListeners(event);
  }

  onDisconnect(callback: () => void): void {
    this.on('disconnected', callback);
  }

  private createMockWebSocket(): WebSocket {
    // Mock WebSocket para desenvolvimento
    const mockWs = {
      readyState: WebSocket.CONNECTING,
      onopen: null as ((event: Event) => void) | null,
      onmessage: null as ((event: MessageEvent) => void) | null,
      onclose: null as ((event: CloseEvent) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      
      send: (data: string) => {
        // Simular echo de mensagens para teste
        setTimeout(() => {
          if (mockWs.onmessage) {
            const echoMessage = {
              data: JSON.stringify({
                ...JSON.parse(data),
                echo: true
              })
            } as MessageEvent;
            mockWs.onmessage(echoMessage);
          }
        }, 100);
      },
      
      close: (code?: number, reason?: string) => {
        (mockWs as any).readyState = WebSocket.CLOSED;
        if (mockWs.onclose) {
          mockWs.onclose({ code: code || 1000, reason: reason || '' } as CloseEvent);
        }
      }
    } as WebSocket;

    // Simular conexão bem-sucedida
    setTimeout(() => {
      (mockWs as any).readyState = WebSocket.OPEN;
      if (mockWs.onopen) {
        mockWs.onopen({} as Event);
      }
    }, 500);

    return mockWs;
  }

  private handleMessage(message: RealtimeMessage): void {
    // Não processar mensagens próprias (exceto echo para teste)
    if (message.userId === this.userId && !('echo' in message.data)) {
      return;
    }

    // Emitir evento específico do tipo de mensagem
    this.emit(message.type, message.data);
    
    // Emitir evento genérico de mensagem
    this.emit('message', message);

    // Processar tipos especiais de mensagem
    switch (message.type) {
      case 'heartbeat-response':
        // Heartbeat recebido
        break;
        
      case 'user-joined':
        console.log(`[Realtime] Usuário entrou: ${message.data.userId}`);
        break;
        
      case 'user-left':
        console.log(`[Realtime] Usuário saiu: ${message.data.userId}`);
        break;
        
      case 'element-locked':
        console.log(`[Realtime] Elemento bloqueado: ${message.data.elementId} por ${message.userId}`);
        break;
        
      case 'element-unlocked':
        console.log(`[Realtime] Elemento desbloqueado: ${message.data.elementId} por ${message.userId}`);
        break;
        
      case 'conflict-detected':
        console.warn('[Realtime] Conflito detectado:', message.data);
        break;
    }
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.stopHeartbeat();
    this.emit('disconnected');
    
    // Tentar reconectar automaticamente
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      console.error('[Realtime] Máximo de tentativas de reconexão atingido');
      this.emit('max-reconnect-attempts-reached');
    }
  }

  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Backoff exponencial
    
  console.log(`[Realtime] Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);
    
    setTimeout(async () => {
      try {
        if (this.projectId && this.userId) {
          await this.connect(this.projectId, this.userId);
        }
      } catch (error) {
        console.error('[Realtime] Falha na reconexão:', error);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    const interval = this.options.heartbeatInterval || 30000; // 30 segundos
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send('heartbeat', { timestamp: new Date() });
      }
    }, interval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private queueMessage(message: RealtimeMessage): void {
    this.messageQueue.push(message);
    
    // Limitar tamanho da fila
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()!;
      try {
        this.ws?.send(JSON.stringify(message));
      } catch (error) {
        console.error('[Realtime] Erro ao processar fila de mensagens:', error);
        break;
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos de utilidade
  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  clearQueue(): void {
    this.messageQueue = [];
  }

  // Métodos para broadcast de eventos específicos
  broadcastCursorMove(position: { x: number; y: number }): void {
    this.send('cursor-moved', { position });
  }

  broadcastElementSelect(elementId: string): void {
    this.send('element-selected', { elementId });
  }

  broadcastElementModify(elementId: string, changes: any): void {
    this.send('element-modified', { elementId, changes });
  }

  broadcastChatMessage(message: string, contextual?: any): void {
    this.send('chat-message', { message, contextual });
  }

  // Métodos para controle de elementos
  lockElement(elementId: string): void {
    this.send('element-lock', { elementId });
  }

  unlockElement(elementId: string): void {
    this.send('element-unlock', { elementId });
  }

  requestElementLock(elementId: string): void {
    this.send('element-lock-request', { elementId });
  }
}

// Instância singleton
export const realtimeService = new RealtimeService({
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  timeout: 10000
});

export default realtimeService;