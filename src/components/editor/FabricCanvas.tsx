import React, { useEffect, useRef, useState, useCallback } from 'react'
import { fabric } from 'fabric'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Trash2, 
  Copy, 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  Download,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FabricCanvasProps {
  width?: number
  height?: number
  onCanvasChange?: (canvas: fabric.Canvas) => void
  className?: string
}

interface CanvasState {
  zoom: number
  panX: number
  panY: number
  selectedTool: string
  isDrawing: boolean
}

interface LayerInfo {
  id: string
  name: string
  type: string
  visible: boolean
  locked: boolean
  opacity: number
}

const CANVAS_TOOLS = {
  select: { icon: Move, label: 'Selecionar' },
  text: { icon: Type, label: 'Texto' },
  rectangle: { icon: Square, label: 'Retângulo' },
  circle: { icon: Circle, label: 'Círculo' },
  image: { icon: ImageIcon, label: 'Imagem' }
}

export default function FabricCanvas({ 
  width = 1920, 
  height = 1080, 
  onCanvasChange, 
  className 
}: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    selectedTool: 'select',
    isDrawing: false
  })
  
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return

    try {
      // Create Fabric.js canvas with optimized settings
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        skipTargetFind: false,
        perPixelTargetFind: true,
        targetFindTolerance: 5,
        // Performance optimizations
        enableRetinaScaling: true,
        imageSmoothingEnabled: true,
        allowTouchScrolling: false
      })

      // Configure canvas for better performance
      canvas.freeDrawingBrush.width = 2
      canvas.freeDrawingBrush.color = '#000000'

      // Event listeners for canvas interactions
      canvas.on('selection:created', handleSelectionCreated)
      canvas.on('selection:updated', handleSelectionUpdated)
      canvas.on('selection:cleared', handleSelectionCleared)
      canvas.on('object:added', handleObjectAdded)
      canvas.on('object:removed', handleObjectRemoved)
      canvas.on('object:modified', handleObjectModified)
      canvas.on('mouse:wheel', handleMouseWheel)
      canvas.on('mouse:down', handleMouseDown)
      canvas.on('mouse:move', handleMouseMove)
      canvas.on('mouse:up', handleMouseUp)

      fabricCanvasRef.current = canvas
      setIsInitialized(true)
      
      // Notify parent component
      if (onCanvasChange) {
        onCanvasChange(canvas)
      }

      toast.success('Canvas inicializado com sucesso!')
    } catch (error) {
      console.error('Erro ao inicializar canvas:', error)
      toast.error('Erro ao inicializar canvas')
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [width, height, onCanvasChange])

  // Canvas event handlers
  const handleSelectionCreated = useCallback((e: fabric.IEvent) => {
    const activeObjects = fabricCanvasRef.current?.getActiveObjects() || []
    setSelectedObjects(activeObjects)
  }, [])

  const handleSelectionUpdated = useCallback((e: fabric.IEvent) => {
    const activeObjects = fabricCanvasRef.current?.getActiveObjects() || []
    setSelectedObjects(activeObjects)
  }, [])

  const handleSelectionCleared = useCallback(() => {
    setSelectedObjects([])
  }, [])

  const handleObjectAdded = useCallback((e: fabric.IEvent) => {
    updateLayers()
  }, [])

  const handleObjectRemoved = useCallback((e: fabric.IEvent) => {
    updateLayers()
  }, [])

  const handleObjectModified = useCallback((e: fabric.IEvent) => {
    updateLayers()
  }, [])

  const handleMouseWheel = useCallback((opt: fabric.IEvent) => {
    const delta = (opt.e as WheelEvent).deltaY
    let zoom = fabricCanvasRef.current?.getZoom() || 1
    zoom *= 0.999 ** delta
    
    if (zoom > 20) zoom = 20
    if (zoom < 0.01) zoom = 0.01
    
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.zoomToPoint(
        { x: (opt.e as MouseEvent).offsetX, y: (opt.e as MouseEvent).offsetY },
        zoom
      )
      setCanvasState(prev => ({ ...prev, zoom }))
    }
    
    opt.e.preventDefault()
    opt.e.stopPropagation()
  }, [])

  const handleMouseDown = useCallback((opt: fabric.IEvent) => {
    const evt = opt.e as MouseEvent
    if (canvasState.selectedTool === 'select') {
      // Pan mode when holding space or middle mouse
      if (evt.button === 1 || evt.ctrlKey) {
        setCanvasState(prev => ({ 
          ...prev, 
          isDrawing: true,
          panX: evt.clientX,
          panY: evt.clientY
        }))
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.isDragging = true
          fabricCanvasRef.current.selection = false
        }
      }
    }
  }, [canvasState.selectedTool])

  const handleMouseMove = useCallback((opt: fabric.IEvent) => {
    if (canvasState.isDrawing && fabricCanvasRef.current?.isDragging) {
      const evt = opt.e as MouseEvent
      const vpt = fabricCanvasRef.current.viewportTransform
      if (vpt) {
        vpt[4] += evt.clientX - canvasState.panX
        vpt[5] += evt.clientY - canvasState.panY
        fabricCanvasRef.current.requestRenderAll()
        setCanvasState(prev => ({
          ...prev,
          panX: evt.clientX,
          panY: evt.clientY
        }))
      }
    }
  }, [canvasState.isDrawing, canvasState.panX, canvasState.panY])

  const handleMouseUp = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.isDragging = false
      fabricCanvasRef.current.selection = true
    }
    setCanvasState(prev => ({ ...prev, isDrawing: false }))
  }, [])

  // Update layers list
  const updateLayers = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const objects = fabricCanvasRef.current.getObjects()
    const layerInfos: LayerInfo[] = objects.map((obj, index) => ({
      id: obj.id || `layer-${index}`,
      name: obj.name || `${obj.type} ${index + 1}`,
      type: obj.type || 'object',
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      opacity: obj.opacity || 1
    }))
    
    setLayers(layerInfos)
  }, [])

  // Tool handlers
  const handleToolSelect = useCallback((tool: string) => {
    setCanvasState(prev => ({ ...prev, selectedTool: tool }))
    
    if (fabricCanvasRef.current) {
      // Reset canvas mode
      fabricCanvasRef.current.isDrawingMode = false
      fabricCanvasRef.current.selection = tool === 'select'
    }
  }, [])

  const addText = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const text = new fabric.IText('Clique para editar', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#000000',
      name: 'Texto'
    })
    
    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.requestRenderAll()
  }, [])

  const addRectangle = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      name: 'Retângulo'
    })
    
    fabricCanvasRef.current.add(rect)
    fabricCanvasRef.current.setActiveObject(rect)
    fabricCanvasRef.current.requestRenderAll()
  }, [])

  const addCircle = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: '#10b981',
      stroke: '#059669',
      strokeWidth: 2,
      name: 'Círculo'
    })
    
    fabricCanvasRef.current.add(circle)
    fabricCanvasRef.current.setActiveObject(circle)
    fabricCanvasRef.current.requestRenderAll()
  }, [])

  const addImage = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !fabricCanvasRef.current) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string
      
      fabric.Image.fromURL(imgUrl, (img) => {
        if (!fabricCanvasRef.current) return
        
        // Scale image to fit canvas
        const maxWidth = fabricCanvasRef.current.width! * 0.5
        const maxHeight = fabricCanvasRef.current.height! * 0.5
        
        if (img.width! > maxWidth || img.height! > maxHeight) {
          const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!)
          img.scale(scale)
        }
        
        img.set({
          left: 100,
          top: 100,
          name: 'Imagem'
        })
        
        fabricCanvasRef.current.add(img)
        fabricCanvasRef.current.setActiveObject(img)
        fabricCanvasRef.current.requestRenderAll()
      })
    }
    
    reader.readAsDataURL(file)
  }, [])

  // Canvas manipulation
  const handleZoomIn = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const zoom = Math.min(canvasState.zoom * 1.2, 20)
    fabricCanvasRef.current.setZoom(zoom)
    setCanvasState(prev => ({ ...prev, zoom }))
  }, [canvasState.zoom])

  const handleZoomOut = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const zoom = Math.max(canvasState.zoom * 0.8, 0.01)
    fabricCanvasRef.current.setZoom(zoom)
    setCanvasState(prev => ({ ...prev, zoom }))
  }, [canvasState.zoom])

  const handleZoomFit = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    fabricCanvasRef.current.setZoom(1)
    fabricCanvasRef.current.viewportTransform = [1, 0, 0, 1, 0, 0]
    fabricCanvasRef.current.requestRenderAll()
    setCanvasState(prev => ({ ...prev, zoom: 1, panX: 0, panY: 0 }))
  }, [])

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const activeObjects = fabricCanvasRef.current.getActiveObjects()
    if (activeObjects.length > 0) {
      fabricCanvasRef.current.remove(...activeObjects)
      fabricCanvasRef.current.discardActiveObject()
      fabricCanvasRef.current.requestRenderAll()
    }
  }, [])

  const duplicateSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const activeObjects = fabricCanvasRef.current.getActiveObjects()
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        obj.clone((cloned: fabric.Object) => {
          cloned.set({
            left: (cloned.left || 0) + 20,
            top: (cloned.top || 0) + 20
          })
          fabricCanvasRef.current?.add(cloned)
        })
      })
      fabricCanvasRef.current.requestRenderAll()
    }
  }, [])

  // Layer management
  const toggleLayerVisibility = useCallback((layerId: string) => {
    if (!fabricCanvasRef.current) return
    
    const objects = fabricCanvasRef.current.getObjects()
    const obj = objects.find(o => (o.id || `layer-${objects.indexOf(o)}`) === layerId)
    
    if (obj) {
      obj.set('visible', !obj.visible)
      fabricCanvasRef.current.requestRenderAll()
      updateLayers()
    }
  }, [updateLayers])

  const toggleLayerLock = useCallback((layerId: string) => {
    if (!fabricCanvasRef.current) return
    
    const objects = fabricCanvasRef.current.getObjects()
    const obj = objects.find(o => (o.id || `layer-${objects.indexOf(o)}`) === layerId)
    
    if (obj) {
      obj.set('selectable', obj.selectable === false)
      fabricCanvasRef.current.requestRenderAll()
      updateLayers()
    }
  }, [updateLayers])

  // Export canvas
  const exportCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return
    
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    })
    
    const link = document.createElement('a')
    link.download = 'canvas-export.png'
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Canvas exportado com sucesso!')
  }, [])

  if (!isInitialized) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Inicializando Canvas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("w-full flex gap-4", className)}>
      {/* Main Canvas Area */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Editor Canvas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {Math.round(canvasState.zoom * 100)}%
              </Badge>
              <Button variant="outline" size="sm" onClick={exportCanvas}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1">
              {Object.entries(CANVAS_TOOLS).map(([key, tool]) => {
                const Icon = tool.icon
                return (
                  <Button
                    key={key}
                    variant={canvasState.selectedTool === key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      if (key === 'text') addText()
                      else if (key === 'rectangle') addRectangle()
                      else if (key === 'circle') addCircle()
                      else if (key === 'image') addImage()
                      else handleToolSelect(key)
                    }}
                    title={tool.label}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                )
              })}
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleZoomFit}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {selectedObjects.length > 0 && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={duplicateSelected}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={deleteSelected}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Canvas Container */}
          <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
            <div className="bg-white shadow-lg mx-auto" style={{ width: 'fit-content' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Layers Panel */}
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Camadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {layers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Nenhuma camada criada
              </p>
            ) : (
              layers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLayerVisibility(layer.id)}
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLayerLock(layer.id)}
                  >
                    {layer.locked ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{layer.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{layer.type}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(layer.opacity * 100)}%
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}