import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { toast } from 'sonner'
import {
  Play, Pause, Square, Volume2, VolumeX, ZoomIn, ZoomOut, RotateCw,
  Move, MousePointer, Square as RectIcon, Circle, Type, Image,
  Layers, Eye, EyeOff, Lock, Unlock, Copy, Trash2, FlipHorizontal,
  FlipVertical, CornerUpLeft, CornerUpRight, Grid, Crosshair,
  RotateCcw,
  Zap,
  Settings
} from 'lucide-react'
import { FabricCanvasManager } from '@/lib/fabric/fabric-canvas'

// Interfaces
interface AdvancedCanvasProps {
  width: number
  height: number
  currentTime: number
  duration: number
  layers: CanvasLayer[]
  selectedLayers: string[]
  tool: CanvasTool
  zoom: number
  showGrid: boolean
  showRulers: boolean
  showSafeZones: boolean
  snapToGrid: boolean
  snapToObjects: boolean
  onLayerSelect: (layerId: string, addToSelection?: boolean) => void
  onLayerUpdate: (layerId: string, updates: Partial<CanvasLayer>) => void
  onLayerCreate: (layer: Omit<CanvasLayer, 'id'>) => void
  onLayerDelete: (layerId: string) => void
  onToolChange: (tool: CanvasTool) => void
  onZoomChange: (zoom: number) => void
  className?: string
}

interface CanvasLayer {
  id: string
  name: string
  type: 'video' | 'image' | 'text' | 'shape' | 'avatar' | 'effect'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  visible: boolean
  locked: boolean
  blendMode: BlendMode
  filters: LayerFilter[]
  properties: LayerProperties
  keyframes: LayerKeyframe[]
  startTime: number
  duration: number
}

interface LayerProperties {
  // Text properties
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  
  // Image/Video properties
  src?: string
  fit?: 'cover' | 'contain' | 'fill' | 'none'
  
  // Shape properties
  fill?: string
  stroke?: string
  strokeWidth?: number
  
  // Avatar properties
  avatarId?: string
  expression?: string
  pose?: string
  
  [key: string]: any
}

interface LayerFilter {
  id: string
  type: string
  enabled: boolean
  parameters: { [key: string]: any }
}

interface LayerKeyframe {
  id: string
  time: number
  property: string
  value: any
  easing: string
}

type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn' | 'darken' | 'lighten' | 'difference' | 'exclusion'

type CanvasTool = 'select' | 'move' | 'rotate' | 'scale' | 'text' | 'rectangle' | 'circle' | 'line' | 'pen' | 'eraser' | 'eyedropper'

interface TransformHandle {
  type: 'corner' | 'edge' | 'rotation'
  position: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotation'
  x: number
  y: number
  cursor: string
}

interface DragState {
  isDragging: boolean
  dragType: 'move' | 'resize' | 'rotate' | 'create'
  startX: number
  startY: number
  currentX: number
  currentY: number
  originalLayer?: CanvasLayer
  handleType?: string
}

interface SelectionBox {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
}

// Componente principal
const AdvancedCanvas: React.FC<AdvancedCanvasProps> = ({
  width,
  height,
  currentTime,
  duration,
  layers,
  selectedLayers,
  tool,
  zoom,
  showGrid,
  showRulers,
  showSafeZones,
  snapToGrid,
  snapToObjects,
  onLayerSelect,
  onLayerUpdate,
  onLayerCreate,
  onLayerDelete,
  onToolChange,
  onZoomChange,
  className = ''
}) => {
  // Estados
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'move',
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  })

  const [selectionBox, setSelectionBox] = useState<SelectionBox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false
  })

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    layerId: string | null
  }>({ visible: false, x: 0, y: 0, layerId: null })

  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null)

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const fabricManagerRef = useRef<FabricCanvasManager | null>(null)
  
  // Performance state
  const [performanceMode, setPerformanceMode] = useState(false)
  const [renderStats, setRenderStats] = useState({
    fps: 0,
    renderTime: 0,
    elementCount: 0
  })

  // Computed values
  const canvasWidth = width * zoom
  const canvasHeight = height * zoom
  const rulerSize = showRulers ? 30 : 0

  // Filtrar layers visíveis no tempo atual
  const visibleLayers = useMemo(() => {
    return layers.filter(layer => {
      const layerStart = layer.startTime
      const layerEnd = layer.startTime + layer.duration
      return currentTime >= layerStart && currentTime <= layerEnd && layer.visible
    })
  }, [layers, currentTime])
  
  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!fabricCanvasRef.current) return
    
    const fabricManager = new FabricCanvasManager(fabricCanvasRef.current, {
      maxElements: 1000,
      enableViewportCulling: performanceMode,
      enableObjectPooling: performanceMode,
      enableBatchUpdates: performanceMode,
      maxRenderFPS: performanceMode ? 30 : 60
    })
    
    fabricManagerRef.current = fabricManager
    
    // Performance monitoring
    fabricManager.on('performanceUpdate', (metrics) => {
      setRenderStats({
        fps: metrics.fps || 0,
        renderTime: metrics.renderTime || 0,
        elementCount: metrics.elementCount || 0
      })
    })
    
    // Auto-optimize for large scenes
    fabricManager.on('elementAdded', () => {
      const elementCount = fabricManager.getState().elements.length
      if (elementCount > 100 && !performanceMode) {
        setPerformanceMode(true)
        fabricManager.enablePerformanceMode()
      }
    })
    
    return () => {
      fabricManager.dispose()
      fabricManagerRef.current = null
    }
  }, [performanceMode])
  
  // Performance mode toggle
  const togglePerformanceMode = useCallback(() => {
    const newMode = !performanceMode
    setPerformanceMode(newMode)
    
    if (fabricManagerRef.current) {
      if (newMode) {
        fabricManagerRef.current.enablePerformanceMode()
      } else {
        fabricManagerRef.current.disablePerformanceMode()
      }
    }
  }, [performanceMode])
  
  // Optimize for large canvas
  const optimizeForLargeCanvas = useCallback(() => {
    if (fabricManagerRef.current) {
      fabricManagerRef.current.optimizeForLargeCanvas()
      setPerformanceMode(true)
    }
  }, [])

  // Funções utilitárias
  const snapValue = useCallback((value: number, snapSize: number = 10): number => {
    if (!snapToGrid) return value
    return Math.round(value / snapSize) * snapSize
  }, [snapToGrid])

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    
    const rect = container.getBoundingClientRect()
    const x = (clientX - rect.left - rulerSize) / zoom
    const y = (clientY - rect.top - rulerSize) / zoom
    
    return { x, y }
  }, [zoom, rulerSize])

  const getLayerAtPoint = useCallback((x: number, y: number): CanvasLayer | null => {
    // Buscar da camada superior para inferior
    for (let i = visibleLayers.length - 1; i >= 0; i--) {
      const layer = visibleLayers[i]
      if (layer.locked) continue
      
      const layerBounds = {
        left: layer.x,
        top: layer.y,
        right: layer.x + layer.width * layer.scaleX,
        bottom: layer.y + layer.height * layer.scaleY
      }
      
      if (x >= layerBounds.left && x <= layerBounds.right &&
          y >= layerBounds.top && y <= layerBounds.bottom) {
        return layer
      }
    }
    
    return null
  }, [visibleLayers])

  const getTransformHandles = useCallback((layer: CanvasLayer): TransformHandle[] => {
    const handles: TransformHandle[] = []
    const bounds = {
      left: layer.x * zoom,
      top: layer.y * zoom,
      right: (layer.x + layer.width * layer.scaleX) * zoom,
      bottom: (layer.y + layer.height * layer.scaleY) * zoom
    }
    
    const centerX = (bounds.left + bounds.right) / 2
    const centerY = (bounds.top + bounds.bottom) / 2
    
    // Corner handles
    handles.push(
      { type: 'corner', position: 'nw', x: bounds.left, y: bounds.top, cursor: 'nw-resize' },
      { type: 'corner', position: 'ne', x: bounds.right, y: bounds.top, cursor: 'ne-resize' },
      { type: 'corner', position: 'se', x: bounds.right, y: bounds.bottom, cursor: 'se-resize' },
      { type: 'corner', position: 'sw', x: bounds.left, y: bounds.bottom, cursor: 'sw-resize' }
    )
    
    // Edge handles
    handles.push(
      { type: 'edge', position: 'n', x: centerX, y: bounds.top, cursor: 'n-resize' },
      { type: 'edge', position: 'e', x: bounds.right, y: centerY, cursor: 'e-resize' },
      { type: 'edge', position: 's', x: centerX, y: bounds.bottom, cursor: 's-resize' },
      { type: 'edge', position: 'w', x: bounds.left, y: centerY, cursor: 'w-resize' }
    )
    
    // Rotation handle
    handles.push({
      type: 'rotation',
      position: 'rotation',
      x: centerX,
      y: bounds.top - 30,
      cursor: 'grab'
    })
    
    return handles
  }, [zoom])

  const renderLayer = useCallback((ctx: CanvasRenderingContext2D, layer: CanvasLayer) => {
    ctx.save()
    
    // Aplicar transformações
    ctx.globalAlpha = layer.opacity
    ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation
    
    const centerX = layer.x + (layer.width * layer.scaleX) / 2
    const centerY = layer.y + (layer.height * layer.scaleY) / 2
    
    ctx.translate(centerX, centerY)
    ctx.rotate((layer.rotation * Math.PI) / 180)
    ctx.scale(layer.scaleX, layer.scaleY)
    ctx.translate(-layer.width / 2, -layer.height / 2)
    
    // Renderizar baseado no tipo
    switch (layer.type) {
      case 'text':
        renderTextLayer(ctx, layer)
        break
      case 'image':
      case 'video':
        renderImageLayer(ctx, layer)
        break
      case 'shape':
        renderShapeLayer(ctx, layer)
        break
      case 'avatar':
        renderAvatarLayer(ctx, layer)
        break
      default:
        renderPlaceholderLayer(ctx, layer)
    }
    
    ctx.restore()
  }, [])

  const renderTextLayer = (ctx: CanvasRenderingContext2D, layer: CanvasLayer) => {
    const props = layer.properties
    
    ctx.font = `${props.fontWeight || 'normal'} ${props.fontSize || 24}px ${props.fontFamily || 'Arial'}`
    ctx.fillStyle = props.color || '#ffffff'
    ctx.textAlign = (props.textAlign || 'left') as CanvasTextAlign
    ctx.textBaseline = 'top'
    
    const text = props.text || 'Texto'
    const lines = text.split('\n')
    const lineHeight = (props.fontSize || 24) * 1.2
    
    lines.forEach((line, index) => {
      let x = 0
      if (props.textAlign === 'center') x = layer.width / 2
      else if (props.textAlign === 'right') x = layer.width
      
      ctx.fillText(line, x, index * lineHeight)
    })
  }

  const renderImageLayer = (ctx: CanvasRenderingContext2D, layer: CanvasLayer) => {
    // Placeholder para imagem/vídeo
    ctx.fillStyle = '#4a5568'
    ctx.fillRect(0, 0, layer.width, layer.height)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      layer.type === 'video' ? '🎥 Vídeo' : '🖼️ Imagem',
      layer.width / 2,
      layer.height / 2
    )
  }

  const renderShapeLayer = (ctx: CanvasRenderingContext2D, layer: CanvasLayer) => {
    const props = layer.properties
    
    ctx.fillStyle = props.fill || '#3182ce'
    ctx.strokeStyle = props.stroke || '#2c5282'
    ctx.lineWidth = props.strokeWidth || 2
    
    if (props.shape === 'circle') {
      const radius = Math.min(layer.width, layer.height) / 2
      ctx.beginPath()
      ctx.arc(layer.width / 2, layer.height / 2, radius, 0, 2 * Math.PI)
      ctx.fill()
      if (props.strokeWidth > 0) ctx.stroke()
    } else {
      // Retângulo
      ctx.fillRect(0, 0, layer.width, layer.height)
      if (props.strokeWidth > 0) {
        ctx.strokeRect(0, 0, layer.width, layer.height)
      }
    }
  }

  const renderAvatarLayer = (ctx: CanvasRenderingContext2D, layer: CanvasLayer) => {
    // Placeholder para avatar
    ctx.fillStyle = '#805ad5'
    ctx.fillRect(0, 0, layer.width, layer.height)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('👤 Avatar', layer.width / 2, layer.height / 2)
  }

  const renderPlaceholderLayer = (ctx: CanvasRenderingContext2D, layer: CanvasLayer) => {
    ctx.fillStyle = '#718096'
    ctx.fillRect(0, 0, layer.width, layer.height)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(layer.name, layer.width / 2, layer.height / 2)
  }

  // Renderizar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Fundo
    ctx.fillStyle = '#1a202c'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Renderizar layers
    visibleLayers.forEach(layer => {
      renderLayer(ctx, layer)
    })
    
    // Safe zones
    if (showSafeZones) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      
      // Action safe (90%)
      const actionSafeMargin = 0.05
      ctx.strokeRect(
        width * actionSafeMargin,
        height * actionSafeMargin,
        width * (1 - actionSafeMargin * 2),
        height * (1 - actionSafeMargin * 2)
      )
      
      // Title safe (80%)
      const titleSafeMargin = 0.1
      ctx.strokeRect(
        width * titleSafeMargin,
        height * titleSafeMargin,
        width * (1 - titleSafeMargin * 2),
        height * (1 - titleSafeMargin * 2)
      )
      
      ctx.setLineDash([])
    }
  }, [visibleLayers, width, height, showSafeZones, renderLayer])

  // Event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(event.clientX, event.clientY)
    const layer = getLayerAtPoint(x, y)
    
    if (tool === 'select') {
      if (layer) {
        if (!selectedLayers.includes(layer.id)) {
          onLayerSelect(layer.id, event.ctrlKey || event.metaKey)
        }
        
        setDragState({
          isDragging: true,
          dragType: 'move',
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
          originalLayer: layer
        })
      } else {
        // Iniciar seleção múltipla
        setSelectionBox({
          x,
          y,
          width: 0,
          height: 0,
          visible: true
        })
      }
    } else if (tool === 'text') {
      // Criar layer de texto
      const newLayer: Omit<CanvasLayer, 'id'> = {
        name: 'Novo Texto',
        type: 'text',
        x: snapValue(x),
        y: snapValue(y),
        width: 200,
        height: 50,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        blendMode: 'normal',
        filters: [],
        properties: {
          text: 'Novo Texto',
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#ffffff',
          textAlign: 'left'
        },
        keyframes: [],
        startTime: currentTime,
        duration: 5
      }
      
      onLayerCreate(newLayer)
    } else if (tool === 'rectangle') {
      // Criar shape retangular
      setDragState({
        isDragging: true,
        dragType: 'create',
        startX: x,
        startY: y,
        currentX: x,
        currentY: y
      })
    }
  }, [tool, getCanvasCoordinates, getLayerAtPoint, selectedLayers, onLayerSelect, snapValue, currentTime, onLayerCreate])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(event.clientX, event.clientY)
    
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, currentX: x, currentY: y }))
      
      if (dragState.dragType === 'move' && dragState.originalLayer) {
        const deltaX = x - dragState.startX
        const deltaY = y - dragState.startY
        
        onLayerUpdate(dragState.originalLayer.id, {
          x: snapValue(dragState.originalLayer.x + deltaX),
          y: snapValue(dragState.originalLayer.y + deltaY)
        })
      }
    } else if (selectionBox.visible) {
      setSelectionBox(prev => ({
        ...prev,
        width: x - prev.x,
        height: y - prev.y
      }))
    } else {
      // Hover detection
      const layer = getLayerAtPoint(x, y)
      setHoveredLayer(layer?.id || null)
    }
  }, [dragState, selectionBox, getCanvasCoordinates, onLayerUpdate, snapValue, getLayerAtPoint])

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.dragType === 'create') {
      const width = Math.abs(dragState.currentX - dragState.startX)
      const height = Math.abs(dragState.currentY - dragState.startY)
      
      if (width > 10 && height > 10) {
        const newLayer: Omit<CanvasLayer, 'id'> = {
          name: 'Nova Shape',
          type: 'shape',
          x: Math.min(dragState.startX, dragState.currentX),
          y: Math.min(dragState.startY, dragState.currentY),
          width,
          height,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          locked: false,
          blendMode: 'normal',
          filters: [],
          properties: {
            shape: tool === 'circle' ? 'circle' : 'rectangle',
            fill: '#3182ce',
            stroke: '#2c5282',
            strokeWidth: 2
          },
          keyframes: [],
          startTime: currentTime,
          duration: 5
        }
        
        onLayerCreate(newLayer)
      }
    }
    
    if (selectionBox.visible) {
      // Selecionar layers na área
      const minX = Math.min(selectionBox.x, selectionBox.x + selectionBox.width)
      const maxX = Math.max(selectionBox.x, selectionBox.x + selectionBox.width)
      const minY = Math.min(selectionBox.y, selectionBox.y + selectionBox.height)
      const maxY = Math.max(selectionBox.y, selectionBox.y + selectionBox.height)
      
      visibleLayers.forEach(layer => {
        const layerBounds = {
          left: layer.x,
          top: layer.y,
          right: layer.x + layer.width * layer.scaleX,
          bottom: layer.y + layer.height * layer.scaleY
        }
        
        if (layerBounds.left < maxX && layerBounds.right > minX &&
            layerBounds.top < maxY && layerBounds.bottom > minY) {
          onLayerSelect(layer.id, true)
        }
      })
      
      setSelectionBox(prev => ({ ...prev, visible: false }))
    }
    
    setDragState({
      isDragging: false,
      dragType: 'move',
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    })
  }, [dragState, selectionBox, visibleLayers, onLayerSelect, tool, currentTime, onLayerCreate])

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    const { x, y } = getCanvasCoordinates(event.clientX, event.clientY)
    const layer = getLayerAtPoint(x, y)
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      layerId: layer?.id || null
    })
  }, [getCanvasCoordinates, getLayerAtPoint])

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
      onZoomChange(Math.max(0.1, Math.min(5, zoom * zoomFactor)))
    }
  }, [zoom, onZoomChange])

  // Fechar menu de contexto
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }))
    }
    
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible])

  return (
    <div className={`relative bg-gray-800 overflow-auto ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-2 left-2 z-20 flex space-x-1 bg-gray-900 rounded-lg p-1">
        <Button
          variant={tool === 'select' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('select')}
        >
          <MousePointer className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === 'move' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('move')}
        >
          <Move className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('text')}
        >
          <Type className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === 'rectangle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('rectangle')}
        >
          <RectIcon className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === 'circle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('circle')}
        >
          <Circle className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Performance and Zoom controls */}
      <div className="absolute top-2 right-2 z-20 flex items-center space-x-2">
        {/* Performance controls */}
        <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-2">
          <Button
            variant={performanceMode ? 'default' : 'ghost'}
            size="sm"
            onClick={togglePerformanceMode}
            title="Toggle Performance Mode"
          >
            <Zap className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={optimizeForLargeCanvas}
            title="Optimize for Large Canvas"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {performanceMode && (
            <div className="text-xs text-green-400">
              {renderStats.fps}fps | {renderStats.elementCount} elements
            </div>
          )}
        </div>
        
        {/* Zoom controls */}
        <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onZoomChange(zoom * 0.8)}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-white min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onZoomChange(zoom * 1.25)}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Rulers */}
      {showRulers && (
        <>
          {/* Horizontal ruler */}
          <div 
            className="absolute top-0 left-8 bg-gray-700 border-b border-gray-600"
            style={{ width: canvasWidth, height: rulerSize }}
          >
            <svg width={canvasWidth} height={rulerSize}>
              {Array.from({ length: Math.ceil(width / 50) + 1 }, (_, i) => {
                const x = i * 50 * zoom
                return (
                  <g key={i}>
                    <line x1={x} y1={0} x2={x} y2={rulerSize} stroke="#9ca3af" strokeWidth={0.5} />
                    <text x={x + 2} y={20} fill="#9ca3af" fontSize={10}>
                      {i * 50}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          
          {/* Vertical ruler */}
          <div 
            className="absolute top-8 left-0 bg-gray-700 border-r border-gray-600"
            style={{ width: rulerSize, height: canvasHeight }}
          >
            <svg width={rulerSize} height={canvasHeight}>
              {Array.from({ length: Math.ceil(height / 50) + 1 }, (_, i) => {
                const y = i * 50 * zoom
                return (
                  <g key={i}>
                    <line x1={0} y1={y} x2={rulerSize} y2={y} stroke="#9ca3af" strokeWidth={0.5} />
                    <text x={2} y={y + 12} fill="#9ca3af" fontSize={10}>
                      {i * 50}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </>
      )}
      
      {/* Canvas container */}
      <div 
        ref={containerRef}
        className="relative"
        style={{
          marginLeft: rulerSize,
          marginTop: rulerSize,
          width: canvasWidth,
          height: canvasHeight
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      >
        {/* Grid */}
        {showGrid && (
          <svg 
            className="absolute inset-0 pointer-events-none"
            width={canvasWidth}
            height={canvasHeight}
          >
            <defs>
              <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
                <path d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`} fill="none" stroke="#374151" strokeWidth={0.5} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}
        
        {/* Fabric.js Canvas (Performance Layer) */}
        <canvas
          ref={fabricCanvasRef}
          width={width}
          height={height}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2,
            border: '2px solid #4a5568'
          }}
          className="bg-transparent"
        />
        
        {/* Legacy Canvas (Fallback) */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            border: '2px solid #4a5568',
            opacity: performanceMode ? 0.3 : 1
          }}
          className="bg-gray-900"
        />
        
        {/* Overlay para seleções e handles */}
        <div 
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            width: canvasWidth,
            height: canvasHeight
          }}
        >
          {/* Selection boxes */}
          {selectedLayers.map(layerId => {
            const layer = visibleLayers.find(l => l.id === layerId)
            if (!layer) return null
            
            const bounds = {
              left: layer.x * zoom,
              top: layer.y * zoom,
              width: layer.width * layer.scaleX * zoom,
              height: layer.height * layer.scaleY * zoom
            }
            
            return (
              <div
                key={layerId}
                className="absolute border-2 border-blue-400"
                style={{
                  left: bounds.left,
                  top: bounds.top,
                  width: bounds.width,
                  height: bounds.height,
                  transform: `rotate(${layer.rotation}deg)`
                }}
              >
                {/* Transform handles */}
                {getTransformHandles(layer).map((handle, index) => (
                  <div
                    key={index}
                    className="absolute w-2 h-2 bg-blue-400 border border-white pointer-events-auto cursor-pointer"
                    style={
                      handle.type === 'rotation'
                        ? {
                            left: handle.x - bounds.left - 4,
                            top: handle.y - bounds.top - 4,
                            borderRadius: '50%'
                          }
                        : {
                            left: handle.x - bounds.left - 4,
                            top: handle.y - bounds.top - 4
                          }
                    }
                  />
                ))}
              </div>
            )
          })}
          
          {/* Hover highlight */}
          {hoveredLayer && !selectedLayers.includes(hoveredLayer) && (
            (() => {
              const layer = visibleLayers.find(l => l.id === hoveredLayer)
              if (!layer) return null
              
              const bounds = {
                left: layer.x * zoom,
                top: layer.y * zoom,
                width: layer.width * layer.scaleX * zoom,
                height: layer.height * layer.scaleY * zoom
              }
              
              return (
                <div
                  className="absolute border-2 border-yellow-400 border-dashed"
                  style={{
                    left: bounds.left,
                    top: bounds.top,
                    width: bounds.width,
                    height: bounds.height,
                    transform: `rotate(${layer.rotation}deg)`
                  }}
                />
              )
            })()
          )}
          
          {/* Selection box */}
          {selectionBox.visible && (
            <div
              className="absolute border-2 border-blue-400 bg-blue-400 bg-opacity-20"
              style={{
                left: Math.min(selectionBox.x, selectionBox.x + selectionBox.width) * zoom,
                top: Math.min(selectionBox.y, selectionBox.y + selectionBox.height) * zoom,
                width: Math.abs(selectionBox.width) * zoom,
                height: Math.abs(selectionBox.height) * zoom
              }}
            />
          )}
          
          {/* Creation preview */}
          {dragState.isDragging && dragState.dragType === 'create' && (
            <div
              className="absolute border-2 border-green-400 bg-green-400 bg-opacity-20"
              style={{
                left: Math.min(dragState.startX, dragState.currentX) * zoom,
                top: Math.min(dragState.startY, dragState.currentY) * zoom,
                width: Math.abs(dragState.currentX - dragState.startX) * zoom,
                height: Math.abs(dragState.currentY - dragState.startY) * zoom
              }}
            />
          )}
        </div>
      </div>
      
      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-2 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          {contextMenu.layerId ? (
            <>
              <button className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center space-x-2">
                <Copy className="w-4 h-4" />
                <span>Duplicar</span>
              </button>
              <button 
                className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center space-x-2 text-red-400"
                onClick={() => {
                  if (contextMenu.layerId) {
                    onLayerDelete(contextMenu.layerId)
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }))
                }}
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            </>
          ) : (
            <>
              <button className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center space-x-2">
                <Type className="w-4 h-4" />
                <span>Adicionar Texto</span>
              </button>
              <button className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center space-x-2">
                <Image className="w-4 h-4" />
                <span>Adicionar Imagem</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default AdvancedCanvas