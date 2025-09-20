// ========== SISTEMA DE HISTÓRICO E DESFAZER PARA PPTX STUDIO ==========

export class PPTXHistoryManager {
  constructor(options = {}) {
    this.options = {
      maxHistorySize: options.maxHistorySize || 50,
      autoSave: options.autoSave !== false,
      autoSaveInterval: options.autoSaveInterval || 5000, // 5 segundos
      ...options
    };

    this.history = [];
    this.redoStack = [];
    this.currentIndex = -1;
    this.isRecording = false;
    this.batchOperations = [];
    this.autoSaveTimeout = null;
  }

  // Gerenciamento de estados
  recordState(action) {
    if (this.isRecording) {
      this.batchOperations.push(action);
      return;
    }

    // Limpar redo stack quando uma nova ação é realizada
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
      this.redoStack = [];
    }

    // Adicionar novo estado
    const state = {
      ...action,
      timestamp: Date.now(),
      id: this.generateStateId()
    };

    this.history.push(state);
    this.currentIndex++;

    // Limitar tamanho do histórico
    if (this.history.length > this.options.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    // Programar auto-save se habilitado
    if (this.options.autoSave) {
      this.scheduleAutoSave();
    }
  }

  startBatch() {
    this.isRecording = true;
    this.batchOperations = [];
  }

  endBatch(batchName = 'Operação em lote') {
    if (!this.isRecording) return;

    this.isRecording = false;
    if (this.batchOperations.length > 0) {
      this.recordState({
        type: 'batch',
        name: batchName,
        operations: [...this.batchOperations]
      });
    }
    this.batchOperations = [];
  }

  // Operações de desfazer/refazer
  async undo() {
    if (!this.canUndo()) return null;

    const state = this.history[this.currentIndex];
    this.currentIndex--;

    // Adicionar estado atual à pilha de refazer
    this.redoStack.push(state);

    // Retornar estado anterior
    return this.currentIndex >= 0 ? this.history[this.currentIndex] : null;
  }

  async redo() {
    if (!this.canRedo()) return null;

    const state = this.redoStack.pop();
    this.currentIndex++;
    this.history[this.currentIndex] = state;

    return state;
  }

  // Verificações de estado
  canUndo() {
    return this.currentIndex >= 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  // Gerenciamento de histórico
  getHistory() {
    return {
      history: this.history,
      currentIndex: this.currentIndex,
      redoStack: this.redoStack
    };
  }

  getCurrentState() {
    return this.currentIndex >= 0 ? this.history[this.currentIndex] : null;
  }

  getStateAt(index) {
    if (index >= 0 && index < this.history.length) {
      return this.history[index];
    }
    return null;
  }

  // Navegação no histórico
  async goToState(stateId) {
    const targetIndex = this.history.findIndex(state => state.id === stateId);
    if (targetIndex === -1) return null;

    // Determinar direção da navegação
    const isForward = targetIndex > this.currentIndex;
    
    // Executar desfazer/refazer até alcançar o estado desejado
    while (this.currentIndex !== targetIndex) {
      if (isForward) {
        await this.redo();
      } else {
        await this.undo();
      }
    }

    return this.getCurrentState();
  }

  // Auto-save e persistência
  scheduleAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.saveHistory();
    }, this.options.autoSaveInterval);
  }

  async saveHistory() {
    try {
      const historyData = {
        history: this.history,
        currentIndex: this.currentIndex,
        timestamp: Date.now()
      };

      // Emitir evento de salvamento
      this.emit('historySaved', historyData);

      return historyData;
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      throw error;
    }
  }

  async loadHistory(historyData) {
    try {
      this.history = historyData.history || [];
      this.currentIndex = historyData.currentIndex || -1;
      this.redoStack = [];

      // Emitir evento de carregamento
      this.emit('historyLoaded', this.getHistory());

      return this.getCurrentState();
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      throw error;
    }
  }

  // Gerenciamento de eventos
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.#listeners.has(event)) {
      this.#listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.#listeners.has(event)) {
      for (const callback of this.#listeners.get(event)) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${event}:`, error);
        }
      }
    }
  }

  // Utilitários
  generateStateId() {
    return `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  clearHistory() {
    this.history = [];
    this.redoStack = [];
    this.currentIndex = -1;
    this.emit('historyCleared');
  }

  // Análise e debug
  getHistoryStats() {
    return {
      totalStates: this.history.length,
      currentIndex: this.currentIndex,
      redoStackSize: this.redoStack.length,
      oldestState: this.history[0]?.timestamp,
      newestState: this.history[this.history.length - 1]?.timestamp,
      batchOperationsCount: this.history.filter(state => state.type === 'batch').length
    };
  }

  getStatesSince(timestamp) {
    return this.history.filter(state => state.timestamp > timestamp);
  }

  // Otimização de memória
  optimizeHistory() {
    // Combinar operações sequenciais do mesmo tipo
    const optimizedHistory = [];
    let currentBatch = null;

    for (const state of this.history) {
      if (!currentBatch || state.type !== currentBatch.type) {
        if (currentBatch) {
          optimizedHistory.push(currentBatch);
        }
        currentBatch = { ...state, operations: [state] };
      } else {
        currentBatch.operations.push(state);
      }
    }

    if (currentBatch) {
      optimizedHistory.push(currentBatch);
    }

    this.history = optimizedHistory;
    this.currentIndex = Math.min(this.currentIndex, optimizedHistory.length - 1);
    this.redoStack = [];

    return this.getHistoryStats();
  }
}