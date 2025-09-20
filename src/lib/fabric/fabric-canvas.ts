import { fabric } from 'fabric'
import { EventEmitter } from '../../utils/EventEmitter'

export interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'video' | 'audio'
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  opacity: number
  zIndex: number
  locked: boolean
  visible: boolean
  properties: Record<string, any>
  timestamp: number
  // Performance optimization fields
  isInViewport?: boolean
  lastRenderTime?: number
  isDirty?: boolean
  cacheKey?: string
}

export interface CanvasState {
  elements: CanvasElement[]
  selectedElements: string[]
  canvasSize: { width: number; height: number }
  zoom: number
  pan: { x: number; y: number }
  history: CanvasHistoryEntry[]
  historyIndex: number
}

export interface CanvasHistoryEntry {
  id: string
  action: 'add' | 'remove' | 'modify' | 'move' | 'resize'
  timestamp: number
  elements: CanvasElement[]
  description: string
}

export interface LayerManagementOptions {
  maxElements: number // Up to 50 elements per scene as per requirements
  enableGrouping: boolean
  enableLocking: boolean
  enableVisibilityToggle: boolean
  enableViewportCulling: boolean
  enableObjectPooling: boolean
  maxRenderFPS: number
  enableBatchUpdates: boolean
}

export class FabricCanvasManager extends EventEmitter {
  private canvas: fabric.Canvas | null = null
  private state: CanvasState
  private options: LayerManagementOptions
  private elementMap: Map<string, fabric.Object> = new Map()
  private isInitialized = false
  private performanceMetrics = {
    renderTime: 0,
    elementCount: 0,
    lastUpdate: Date.now(),
    fps: 0,
    frameCount: 0,
    lastFPSUpdate: Date.now()
  }
  
  // Performance optimization properties
  private viewport = { x: 0, y: 0, width: 1920, height: 1080 }
  private objectPool: Map<string, fabric.Object[]> = new Map()
  private renderQueue: Set<string> = new Set()
  private batchUpdateTimer: NodeJS.Timeout | null = null
  private lastRenderTime = 0
  private renderThrottle = 1000 / 60 // 60 FPS

  constructor(options: Partial<LayerManagementOptions> = {}) {
    super()
    
    this.options = {
      maxElements: 50,
      enableGrouping: true,
      enableLocking: true,
      enableVisibilityToggle: true,
      enableViewportCulling: true,
      enableObjectPooling: true,
      maxRenderFPS: 60,
      enableBatchUpdates: true,
      ...options
    }

    this.state = {
      elements: [],
      selectedElements: [],
      canvasSize: { width: 1920, height: 1080 }, // Default video resolution
      zoom: 1,
      pan: { x: 0, y: 0 },
      history: [],
      historyIndex: -1
    }

    // Performance optimization properties
    this.setupPerformanceOptimizations()
  }

  private setupPerformanceOptimizations(): void {
    // Initialize object pools for common types
    this.objectPool.set('text', [])
    this.objectPool.set('image', [])
    this.objectPool.set('shape', [])
    this.objectPool.set('video', [])
    
    // Setup render throttling
    this.renderThrottle = 1000 / this.options.maxRenderFPS
  }

  private updateViewport(): void {
    if (!this.canvas) return
    
    const vpt = this.canvas.viewportTransform
    if (!vpt) return
    
    this.viewport = {
      x: -vpt[4] / this.state.zoom,
      y: -vpt[5] / this.state.zoom,
      width: this.state.canvasSize.width / this.state.zoom,
      height: this.state.canvasSize.height / this.state.zoom
    }
    
    if (this.options.enableViewportCulling) {
      this.updateElementVisibility()
    }
  }

  private updateElementVisibility(): void {
    this.state.elements.forEach(element => {
      const isInViewport = this.isElementInViewport(element)
      if (element.isInViewport !== isInViewport) {
        element.isInViewport = isInViewport
        element.isDirty = true
        
        const fabricObject = this.elementMap.get(element.id)
        if (fabricObject) {
          fabricObject.set('visible', element.visible && isInViewport)
        }
      }
    })
  }

  private isElementInViewport(element: CanvasElement): boolean {
    const elementBounds = {
      left: element.position.x,
      top: element.position.y,
      right: element.position.x + element.size.width,
      bottom: element.position.y + element.size.height
    }
    
    const viewportBounds = {
      left: this.viewport.x,
      top: this.viewport.y,
      right: this.viewport.x + this.viewport.width,
      bottom: this.viewport.y + this.viewport.height
    }
    
    return !(elementBounds.right < viewportBounds.left ||
             elementBounds.left > viewportBounds.right ||
             elementBounds.bottom < viewportBounds.top ||
             elementBounds.top > viewportBounds.bottom)
  }

  private getFromPool(type: string): fabric.Object | null {
    if (!this.options.enableObjectPooling) return null
    
    const pool = this.objectPool.get(type)
    return pool && pool.length > 0 ? pool.pop() || null : null
  }

  private returnToPool(type: string, object: fabric.Object): void {
    if (!this.options.enableObjectPooling) return
    
    const pool = this.objectPool.get(type)
    if (pool && pool.length < 10) { // Limit pool size
      // Reset object properties
      object.set({
        left: 0,
        top: 0,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true
      })
      pool.push(object)
    }
  }

  private throttledRender(): void {
    const now = Date.now()
    if (now - this.lastRenderTime < this.renderThrottle) {
      return
    }
    
    this.lastRenderTime = now
    this.canvas?.renderAll()
    this.updateFPS()
  }

  private updateFPS(): void {
    const now = Date.now()
    this.performanceMetrics.frameCount++
    
    if (now - this.performanceMetrics.lastFPSUpdate >= 1000) {
      this.performanceMetrics.fps = this.performanceMetrics.frameCount
      this.performanceMetrics.frameCount = 0
      this.performanceMetrics.lastFPSUpdate = now
      
      this.emit('fpsUpdate', { fps: this.performanceMetrics.fps })
    }
  }

  private batchUpdate(elementId: string): void {
    if (!this.options.enableBatchUpdates) {
      this.processElementUpdate(elementId)
      return
    }
    
    this.renderQueue.add(elementId)
    
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer)
    }
    
    this.batchUpdateTimer = setTimeout(() => {
      this.processBatchUpdates()
    }, 16) // ~60fps
  }

  private processBatchUpdates(): void {
    this.renderQueue.forEach(elementId => {
      this.processElementUpdate(elementId)
    })
    
    this.renderQueue.clear()
    this.throttledRender()
  }

  private processElementUpdate(elementId: string): void {
    const element = this.state.elements.find(el => el.id === elementId)
    const fabricObject = this.elementMap.get(elementId)
    
    if (element && fabricObject && element.isDirty) {
      // Update fabric object properties
      fabricObject.set({
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        angle: element.rotation,
        opacity: element.opacity,
        visible: element.visible && (element.isInViewport ?? true)
      })
      
      element.isDirty = false
      element.lastRenderTime = Date.now()
    }
  }

  async initialize(canvasElement: HTMLCanvasElement): Promise<void> {
    try {
      // Initialize Fabric.js canvas
      this.canvas = new fabric.Canvas(canvasElement, {
        width: this.state.canvasSize.width,
        height: this.state.canvasSize.height,
        backgroundColor: '#000000',
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: false // We'll handle rendering manually for performance
      })
      
      // Setup canvas event listeners
      this.setupCanvasEvents()
      
      // Initialize performance monitoring
      this.performanceMetrics.lastFPSUpdate = Date.now()
      
      // Setup viewport management
      this.updateViewport()
      
      this.emit('initialized', { canvas: this.canvas })
      
    } catch (error) {
      console.error('Erro ao inicializar canvas Fabric.js:', error)
      throw new Error(`Falha na inicialização do canvas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }
  
  private setupCanvasEvents(): void {
    if (!this.canvas) return
    
    // Object selection events
    this.canvas.on('selection:created', (e) => {
      const selectedObjects = e.selected || []
      this.state.selectedElements = selectedObjects.map(obj => obj.id || '').filter(Boolean)
      this.emit('selectionChanged', { selectedElements: this.state.selectedElements })
    })
    
    this.canvas.on('selection:updated', (e) => {
      const selectedObjects = e.selected || []
      this.state.selectedElements = selectedObjects.map(obj => obj.id || '').filter(Boolean)
      this.emit('selectionChanged', { selectedElements: this.state.selectedElements })
    })
    
    this.canvas.on('selection:cleared', () => {
      this.state.selectedElements = []
      this.emit('selectionChanged', { selectedElements: [] })
    })
    
    // Object modification events
    this.canvas.on('object:modified', (e) => {
      if (e.target) {
        const elementId = e.target.id
        if (elementId) {
          this.batchUpdate(elementId)
        }
      }
    })
    
    // Viewport change events
    this.canvas.on('after:render', () => {
      this.updateViewport()
    })
  }
  
  destroy(): void {
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer)
    }
    
    if (this.canvas) {
      this.canvas.dispose()
      this.canvas = null
    }
    
    this.elementMap.clear()
    this.objectPool.clear()
    this.renderQueue.clear()
    
    this.emit('destroyed')
  }