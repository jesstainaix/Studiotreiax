import { EventEmitter } from '../../utils/EventEmitter'

export interface LayerElement {
  id: string
  name: string
  type: 'text' | 'image' | 'shape' | 'video' | 'audio' | 'effect'
  parentId?: string // For grouping
  children: string[] // Child element IDs
  zIndex: number
  visible: boolean
  locked: boolean
  opacity: number
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light'
  transform: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    scaleX: number
    scaleY: number
  }
  properties: Record<string, any>
  metadata: {
    createdAt: number
    updatedAt: number
    tags: string[]
    notes: string
  }
}

export interface LayerGroup {
  id: string
  name: string
  elementIds: string[]
  visible: boolean
  locked: boolean
  expanded: boolean
  color: string
  zIndex: number
}

export interface LayerState {
  elements: LayerElement[]
  groups: LayerGroup[]
  selectedElements: string[]
  selectedGroups: string[]
  maxElements: number
  currentElementCount: number
  zIndexCounter: number
  clipboard: LayerElement[]
  history: LayerHistoryEntry[]
  historyIndex: number
}

export interface LayerHistoryEntry {
  id: string
  action: 'add' | 'remove' | 'modify' | 'group' | 'ungroup' | 'reorder'
  timestamp: number
  elements: LayerElement[]
  groups?: LayerGroup[]
  description: string
}

export interface LayerManagerOptions {
  maxElements: number // Up to 50 elements per scene
  maxGroups: number
  enableAutoNaming: boolean
  enableSmartGrouping: boolean
  enablePerformanceOptimization: boolean
  historyLimit: number
}

export interface LayerFilter {
  type?: LayerElement['type'][]
  visible?: boolean
  locked?: boolean
  tags?: string[]
  searchTerm?: string
}

export class LayerManager extends EventEmitter {
  private state: LayerState
  private options: LayerManagerOptions
  private performanceMetrics = {
    elementCount: 0,
    groupCount: 0,
    renderTime: 0,
    lastUpdate: Date.now()
  }
  private isInitialized = false

  constructor(options: Partial<LayerManagerOptions> = {}) {
    super()
    
    this.options = {
      maxElements: 50, // As per requirements
      maxGroups: 10,
      enableAutoNaming: true,
      enableSmartGrouping: true,
      enablePerformanceOptimization: true,
      historyLimit: 50,
      ...options
    }

    this.state = {
      elements: [],
      groups: [],
      selectedElements: [],
      selectedGroups: [],
      maxElements: this.options.maxElements,
      currentElementCount: 0,
      zIndexCounter: 1000,
      clipboard: [],
      history: [],
      historyIndex: -1
    }
  }

  initialize(): void {
    if (this.isInitialized) {
      console.warn('LayerManager já foi inicializado')
      return
    }
    
    try {
      // Initialize performance monitoring
      this.performanceMetrics.lastUpdate = Date.now()
      
      // Setup auto-save for history
      this.setupAutoSave()
      
      this.isInitialized = true
      this.emit('initialized', { state: this.getState() })
      
    } catch (error) {
      console.error('Erro ao inicializar LayerManager:', error)
      throw new Error(`Falha na inicialização do LayerManager: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }
  
  private setupAutoSave(): void {
    // Auto-save state every 30 seconds
    setInterval(() => {
      this.saveToHistory('auto-save', 'Auto-save do estado atual')
    }, 30000)
  }
  
  private saveToHistory(action: LayerHistoryEntry['action'], description: string): void {
    const historyEntry: LayerHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      timestamp: Date.now(),
      elements: JSON.parse(JSON.stringify(this.state.elements)),
      groups: JSON.parse(JSON.stringify(this.state.groups)),
      description
    }
    
    // Remove entries beyond history limit
    if (this.state.history.length >= this.options.historyLimit) {
      this.state.history = this.state.history.slice(-this.options.historyLimit + 1)
    }
    
    this.state.history.push(historyEntry)
    this.state.historyIndex = this.state.history.length - 1
    
    this.emit('historyUpdated', { history: this.state.history, currentIndex: this.state.historyIndex })
  }
  
  getState(): LayerState {
    return JSON.parse(JSON.stringify(this.state))
  }
  
  destroy(): void {
    this.removeAllListeners()
    this.state.elements = []
    this.state.groups = []
    this.state.selectedElements = []
    this.state.selectedGroups = []
    this.state.history = []
    this.isInitialized = false
    
    this.emit('destroyed')
  }