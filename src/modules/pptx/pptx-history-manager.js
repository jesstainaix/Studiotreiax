/**
 * Sistema de histórico de alterações para PPTX
 */
class PPTXHistoryManager {
    constructor(config = {}) {
        // Configurações padrão
        this.maxHistorySize = config.maxHistorySize || 100;
        this.autoSave = config.autoSave || false;
        this.autoSaveInterval = config.autoSaveInterval || 60000; // 1 minuto
        
        // Estado interno
        this.undoStack = [];
        this.redoStack = [];
        this.currentState = null;
        this.isBatchOperation = false;
        this.batchChanges = [];
        this.lastSaveTime = Date.now();
        
        // Callbacks
        this.onStateChange = config.onStateChange || (() => {});
        this.onAutoSave = config.onAutoSave || (() => {});
        
        // Inicializa autosave se necessário
        if (this.autoSave) {
            this.startAutoSave();
        }
    }

    /**
     * Inicia operação em lote
     */
    beginBatch() {
        this.isBatchOperation = true;
        this.batchChanges = [];
    }

    /**
     * Finaliza operação em lote
     */
    endBatch() {
        if (this.batchChanges.length > 0) {
            this.pushHistory({
                type: 'batch',
                changes: [...this.batchChanges],
                timestamp: Date.now()
            });
        }
        
        this.isBatchOperation = false;
        this.batchChanges = [];
    }

    /**
     * Registra alteração no histórico
     */
    recordChange(change) {
        // Formata alteração
        const formattedChange = {
            ...change,
            timestamp: Date.now()
        };

        if (this.isBatchOperation) {
            // Adiciona à operação em lote
            this.batchChanges.push(formattedChange);
        } else {
            // Adiciona diretamente ao histórico
            this.pushHistory(formattedChange);
        }

        // Atualiza estado atual
        this.currentState = this.computeState(formattedChange);
        
        // Notifica alteração
        this.onStateChange(this.currentState);
    }

    /**
     * Adiciona alteração ao histórico
     */
    pushHistory(change) {
        // Limpa pilha de refazer ao adicionar nova alteração
        this.redoStack = [];
        
        // Adiciona à pilha de desfazer
        this.undoStack.push(change);
        
        // Mantém tamanho máximo do histórico
        while (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
    }

    /**
     * Desfaz última alteração
     */
    undo() {
        if (this.undoStack.length === 0) {
            return null;
        }

        // Remove última alteração da pilha de desfazer
        const change = this.undoStack.pop();
        
        // Adiciona à pilha de refazer
        this.redoStack.push(change);
        
        // Reverte alteração
        const revertedState = this.revertChange(change);
        this.currentState = revertedState;
        
        // Notifica alteração
        this.onStateChange(this.currentState);
        
        return revertedState;
    }

    /**
     * Refaz última alteração desfeita
     */
    redo() {
        if (this.redoStack.length === 0) {
            return null;
        }

        // Remove última alteração da pilha de refazer
        const change = this.redoStack.pop();
        
        // Adiciona de volta à pilha de desfazer
        this.undoStack.push(change);
        
        // Aplica alteração
        const newState = this.computeState(change);
        this.currentState = newState;
        
        // Notifica alteração
        this.onStateChange(this.currentState);
        
        return newState;
    }

    /**
     * Computa novo estado após alteração
     */
    computeState(change) {
        if (change.type === 'batch') {
            // Aplica todas as alterações do lote
            return change.changes.reduce(
                (state, batchChange) => this.applySingleChange(state, batchChange),
                this.currentState
            );
        } else {
            // Aplica alteração única
            return this.applySingleChange(this.currentState, change);
        }
    }

    /**
     * Aplica uma única alteração ao estado
     */
    applySingleChange(state, change) {
        const newState = { ...state };

        switch (change.type) {
            case 'add':
                newState[change.target] = [
                    ...(newState[change.target] || []),
                    change.data
                ];
                break;

            case 'update':
                if (Array.isArray(newState[change.target])) {
                    newState[change.target] = newState[change.target].map(item =>
                        item.id === change.data.id ? change.data : item
                    );
                } else {
                    newState[change.target] = change.data;
                }
                break;

            case 'delete':
                if (Array.isArray(newState[change.target])) {
                    newState[change.target] = newState[change.target].filter(item =>
                        item.id !== change.data.id
                    );
                } else {
                    delete newState[change.target];
                }
                break;

            case 'move':
                if (Array.isArray(newState[change.target])) {
                    const { fromIndex, toIndex } = change.data;
                    const item = newState[change.target][fromIndex];
                    newState[change.target] = [
                        ...newState[change.target].slice(0, fromIndex),
                        ...newState[change.target].slice(fromIndex + 1)
                    ];
                    newState[change.target].splice(toIndex, 0, item);
                }
                break;

            case 'style':
                if (newState[change.target]) {
                    newState[change.target] = {
                        ...newState[change.target],
                        style: {
                            ...(newState[change.target].style || {}),
                            ...change.data
                        }
                    };
                }
                break;
        }

        return newState;
    }

    /**
     * Reverte uma alteração
     */
    revertChange(change) {
        if (change.type === 'batch') {
            // Reverte alterações do lote em ordem reversa
            return change.changes.reduceRight(
                (state, batchChange) => this.revertSingleChange(state, batchChange),
                this.currentState
            );
        } else {
            // Reverte alteração única
            return this.revertSingleChange(this.currentState, change);
        }
    }

    /**
     * Reverte uma única alteração
     */
    revertSingleChange(state, change) {
        const newState = { ...state };

        switch (change.type) {
            case 'add':
                if (Array.isArray(newState[change.target])) {
                    newState[change.target] = newState[change.target].filter(item =>
                        item.id !== change.data.id
                    );
                }
                break;

            case 'update':
                if (Array.isArray(newState[change.target])) {
                    newState[change.target] = newState[change.target].map(item =>
                        item.id === change.data.id ? change.previousData : item
                    );
                } else {
                    newState[change.target] = change.previousData;
                }
                break;

            case 'delete':
                if (Array.isArray(newState[change.target])) {
                    newState[change.target] = [
                        ...newState[change.target],
                        change.data
                    ];
                } else {
                    newState[change.target] = change.data;
                }
                break;

            case 'move':
                if (Array.isArray(newState[change.target])) {
                    const { fromIndex, toIndex } = change.data;
                    const item = newState[change.target][toIndex];
                    newState[change.target] = [
                        ...newState[change.target].slice(0, toIndex),
                        ...newState[change.target].slice(toIndex + 1)
                    ];
                    newState[change.target].splice(fromIndex, 0, item);
                }
                break;

            case 'style':
                if (newState[change.target]) {
                    newState[change.target] = {
                        ...newState[change.target],
                        style: change.previousStyle || {}
                    };
                }
                break;
        }

        return newState;
    }

    /**
     * Inicia autosave
     */
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (Date.now() - this.lastSaveTime >= this.autoSaveInterval) {
                this.saveState();
            }
        }, 1000);
    }

    /**
     * Para autosave
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }

    /**
     * Salva estado atual
     */
    saveState() {
        this.lastSaveTime = Date.now();
        this.onAutoSave(this.currentState);
    }

    /**
     * Retorna estado atual
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Verifica se há alterações para desfazer
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Verifica se há alterações para refazer
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Limpa histórico
     */
    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
        this.batchChanges = [];
        this.isBatchOperation = false;
    }
}

module.exports = PPTXHistoryManager;