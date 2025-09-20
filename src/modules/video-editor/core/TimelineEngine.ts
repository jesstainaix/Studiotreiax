import { TimelineState, TimelineTrack, TimelineItem, TimelineAction, TimelineSnapshot, TimelineConfig } from '../types/Timeline.types';

export class TimelineEngine {
  private state: TimelineState;
  private config: TimelineConfig;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: Partial<TimelineConfig> = {}) {
    this.config = {
      minZoom: 0.1,
      maxZoom: 10,
      defaultTrackHeight: 60,
      snapThreshold: 5,
      autoSave: true,
      maxHistorySteps: 50,
      ...config
    };

    this.state = {
      tracks: this.createDefaultTracks(),
      currentTime: 0,
      duration: 60, // 1 minuto inicial
      zoom: 1,
      pixelsPerSecond: 50,
      isPlaying: false,
      selectedItems: [],
      clipboard: [],
      history: [],
      historyIndex: -1
    };
  }

  // Getters do estado
  getState(): TimelineState {
    return { ...this.state };
  }

  getTracks(): TimelineTrack[] {
    return [...this.state.tracks];
  }

  getCurrentTime(): number {
    return this.state.currentTime;
  }

  getDuration(): number {
    return this.state.duration;
  }

  // Actions principais
  dispatch(action: TimelineAction): void {
    const previousState = { ...this.state };
    
    switch (action.type) {
      case 'ADD_ITEM':
        this.addItem(action.payload);
        break;
      case 'REMOVE_ITEM':
        this.removeItem(action.payload.itemId);
        break;
      case 'MOVE_ITEM':
        this.moveItem(action.payload);
        break;
      case 'RESIZE_ITEM':
        this.resizeItem(action.payload);
        break;
      case 'ADD_TRACK':
        this.addTrack(action.payload);
        break;
      case 'REMOVE_TRACK':
        this.removeTrack(action.payload.trackId);
        break;
      case 'UPDATE_ITEM':
        this.updateItemProps(action.payload);
        break;
      case 'SPLIT_ITEM':
        this.splitItem(action.payload);
        break;
      case 'UNDO':
        this.undo();
        break;
      case 'REDO':
        this.redo();
        break;
      case 'COPY':
        this.copyItems(action.payload.itemIds);
        break;
      case 'PASTE':
        this.pasteItems(action.payload.trackId, action.payload.time);
        break;
      case 'CUT':
        this.cutItems(action.payload.itemIds);
        break;
    }

    // Salvar no histórico se não for undo/redo
    if (!['UNDO', 'REDO'].includes(action.type)) {
      this.saveToHistory(action.type, previousState);
    }

    // Notificar listeners
    this.notifyListeners('stateChanged', this.state);
  }

  // Métodos de manipulação
  private addItem(payload: { item: TimelineItem; trackId: string }): void {
    const track = this.state.tracks.find(t => t.id === payload.trackId);
    if (!track) return;

    // Verificar colisões
    const hasCollision = track.items.some(item => 
      this.itemsOverlap(item, payload.item)
    );

    if (!hasCollision) {
      track.items.push(payload.item);
      this.updateDuration();
    }
  }

  private removeItem(itemId: string): void {
    this.state.tracks.forEach(track => {
      track.items = track.items.filter(item => item.id !== itemId);
    });
    this.state.selectedItems = this.state.selectedItems.filter(id => id !== itemId);
  }

  private moveItem(payload: { itemId: string; trackId: string; startTime: number }): void {
    // Encontrar e remover item da trilha atual
    let item: TimelineItem | null = null;
    for (const track of this.state.tracks) {
      const index = track.items.findIndex(i => i.id === payload.itemId);
      if (index !== -1) {
        item = track.items.splice(index, 1)[0];
        break;
      }
    }

    if (!item) return;

    // Atualizar propriedades do item
    item.startTime = payload.startTime;
    item.trackId = payload.trackId;

    // Adicionar à nova trilha
    const targetTrack = this.state.tracks.find(t => t.id === payload.trackId);
    if (targetTrack) {
      // Verificar colisões
      const hasCollision = targetTrack.items.some(otherItem => 
        this.itemsOverlap(otherItem, item!)
      );

      if (!hasCollision) {
        targetTrack.items.push(item);
      }
    }
    
    this.updateDuration();
  }

  private resizeItem(payload: { itemId: string; startTime?: number; duration: number }): void {
    const item = this.findItemById(payload.itemId);
    if (!item) return;

    if (payload.startTime !== undefined) {
      item.startTime = payload.startTime;
    }
    item.duration = Math.max(0.1, payload.duration); // Mínimo 0.1s
    
    this.updateDuration();
  }

  private addTrack(track: Omit<TimelineTrack, 'id'>): void {
    const newTrack: TimelineTrack = {
      ...track,
      id: this.generateId(),
      items: []
    };
    this.state.tracks.push(newTrack);
  }

  private removeTrack(trackId: string): void {
    this.state.tracks = this.state.tracks.filter(track => track.id !== trackId);
  }

  // Métodos de utilidade
  private itemsOverlap(item1: TimelineItem, item2: TimelineItem): boolean {
    if (item1.id === item2.id) return false;
    
    const end1 = item1.startTime + item1.duration;
    const end2 = item2.startTime + item2.duration;
    
    return !(end1 <= item2.startTime || end2 <= item1.startTime);
  }

  private findItemById(itemId: string): TimelineItem | null {
    for (const track of this.state.tracks) {
      const item = track.items.find(i => i.id === itemId);
      if (item) return item;
    }
    return null;
  }

  private updateItemProps(payload: { itemId: string; properties: Record<string, any> }): void {
    const item = this.findItemById(payload.itemId);
    if (item) {
      item.properties = { ...item.properties, ...payload.properties };
    }
  }

  private updateDuration(): void {
    let maxDuration = 0;
    this.state.tracks.forEach(track => {
      track.items.forEach(item => {
        const itemEnd = item.startTime + item.duration;
        if (itemEnd > maxDuration) {
          maxDuration = itemEnd;
        }
      });
    });
    this.state.duration = Math.max(maxDuration, 10); // Mínimo 10s
  }

  // Sistema de histórico
  private saveToHistory(actionType: string, previousState: TimelineState): void {
    const snapshot: TimelineSnapshot = {
      timestamp: Date.now(),
      tracks: JSON.parse(JSON.stringify(previousState.tracks)),
      action: actionType
    };

    // Remover histórico futuro se estivermos no meio
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    
    // Adicionar novo snapshot
    this.state.history.push(snapshot);
    this.state.historyIndex++;

    // Limitar tamanho do histórico
    if (this.state.history.length > this.config.maxHistorySteps) {
      this.state.history.shift();
      this.state.historyIndex--;
    }
  }

  private undo(): void {
    if (this.state.historyIndex >= 0 && this.state.history[this.state.historyIndex]) {
      const snapshot = this.state.history[this.state.historyIndex];
      this.state.tracks = JSON.parse(JSON.stringify(snapshot.tracks));
      this.state.historyIndex--;
      this.updateDuration();
    }
  }

  private redo(): void {
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.historyIndex++;
      const snapshot = this.state.history[this.state.historyIndex];
      if (snapshot) {
        this.state.tracks = JSON.parse(JSON.stringify(snapshot.tracks));
        this.updateDuration();
      }
    }
  }

  // Sistema de eventos
  addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Métodos de utilidade
  private createDefaultTracks(): TimelineTrack[] {
    return [
      {
        id: this.generateId(),
        name: 'Vídeo Principal',
        type: 'video',
        height: 80,
        color: '#3b82f6',
        muted: false,
        locked: false,
        visible: true,
        items: []
      },
      {
        id: this.generateId(),
        name: 'Áudio',
        type: 'audio', 
        height: 60,
        color: '#10b981',
        muted: false,
        locked: false,
        visible: true,
        items: []
      }
    ];
  }

  private generateId(): string {
    return `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos de clipboard
  private copyItems(itemIds: string[]): void {
    this.state.clipboard = [];
    itemIds.forEach(id => {
      const item = this.findItemById(id);
      if (item) {
        this.state.clipboard.push({ ...item });
      }
    });
  }

  private pasteItems(trackId: string, time: number): void {
    const track = this.state.tracks.find(t => t.id === trackId);
    if (!track || this.state.clipboard.length === 0) return;

    this.state.clipboard.forEach((item, index) => {
      const newItem: TimelineItem = {
        ...item,
        id: this.generateId(),
        startTime: time + (index * 0.1), // Pequeno offset para múltiplos itens
        trackId: trackId
      };

      // Verificar colisão
      const hasCollision = track.items.some(otherItem => 
        this.itemsOverlap(otherItem, newItem)
      );

      if (!hasCollision) {
        track.items.push(newItem);
      }
    });

    this.updateDuration();
  }

  private cutItems(itemIds: string[]): void {
    this.copyItems(itemIds);
    itemIds.forEach(id => this.removeItem(id));
  }

  private splitItem(payload: { itemId: string; time: number }): void {
    const item = this.findItemById(payload.itemId);
    if (!item) return;

    const splitTime = payload.time - item.startTime;
    if (splitTime <= 0 || splitTime >= item.duration) return;

    // Criar segunda parte
    const secondPart: TimelineItem = {
      ...item,
      id: this.generateId(),
      startTime: payload.time,
      duration: item.duration - splitTime
    };

    // Atualizar primeira parte
    item.duration = splitTime;

    // Adicionar segunda parte à trilha
    const track = this.state.tracks.find(t => t.id === item.trackId);
    if (track) {
      track.items.push(secondPart);
    }
  }

  // Métodos de controle de reprodução
  setCurrentTime(time: number): void {
    this.state.currentTime = Math.max(0, Math.min(time, this.state.duration));
    this.notifyListeners('timeChanged', this.state.currentTime);
  }

  play(): void {
    this.state.isPlaying = true;
    this.notifyListeners('playStateChanged', true);
  }

  pause(): void {
    this.state.isPlaying = false;
    this.notifyListeners('playStateChanged', false);
  }

  stop(): void {
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.notifyListeners('playStateChanged', false);
    this.notifyListeners('timeChanged', 0);
  }

  // Métodos de zoom
  setZoom(zoom: number): void {
    this.state.zoom = Math.max(this.config.minZoom, Math.min(zoom, this.config.maxZoom));
    this.state.pixelsPerSecond = 50 * this.state.zoom;
    this.notifyListeners('zoomChanged', this.state.zoom);
  }

  zoomIn(): void {
    this.setZoom(this.state.zoom * 1.2);
  }

  zoomOut(): void {
    this.setZoom(this.state.zoom / 1.2);
  }

  // Carregar projeto/configuração completa
  loadProject(projectData: { tracks: TimelineTrack[]; duration?: number; metadata?: any }): void {
    try {
      
      // Limpar estado atual
      this.state.tracks = [];
      this.state.selectedItems = [];
      this.state.currentTime = 0;
      
      // Aplicar novos dados
      this.state.tracks = projectData.tracks || [];
      this.state.duration = projectData.duration || this.calculateTotalDuration();
      
      // Notificar mudanças
      this.notifyListeners('projectLoaded', projectData);
      this.notifyListeners('stateChanged', this.state);
      
    } catch (error) {
      console.error('Error loading project:', error);
      throw error;
    }
  }
  
  // Calcular duração total baseada nos itens
  private calculateTotalDuration(): number {
    let maxDuration = 60; // mínimo de 1 minuto
    
    this.state.tracks.forEach(track => {
      track.items.forEach(item => {
        const itemEnd = item.startTime + item.duration;
        if (itemEnd > maxDuration) {
          maxDuration = itemEnd;
        }
      });
    });
    
    return maxDuration;
  }

  // Método de limpeza
  destroy(): void {
    this.listeners.clear();
  }
}