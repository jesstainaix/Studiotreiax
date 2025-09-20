import { forwardRef, useRef, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw,
  Grid3X3,
  Crosshair,
  Loader2
} from 'lucide-react'
import { useVideoCache } from '../../hooks/useVideoCache'

interface Layer {
  id: string
  type: 'text' | 'image' | 'audio' | 'video' | 'shape'
  name: string
  startTime: number
  duration: number
  properties: any
  visible: boolean
  locked: boolean
}

interface CanvasProps {
  layers: Layer[]
  currentTime: number
  selectedLayer: string | null
  onLayerSelect: (layerId: string) => void
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void
  projectId?: string
}

interface CanvasState {
  zoom: number
  panX: number
  panY: number
  showGrid: boolean
  showGuides: boolean
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>((
  { layers, currentTime, selectedLayer, onLayerSelect, onLayerUpdate, projectId = 'default' },
  ref
) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    showGuides: true
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragLayer, setDragLayer] = useState<string | null>(null)

  // Dimensões do canvas (16:9)
  const canvasWidth = 800
  const canvasHeight = 450

  // Filtrar camadas visíveis no tempo atual
  const visibleLayers = useMemo(() => 
    layers.filter(layer => 
      layer.visible && 
      currentTime >= layer.startTime && 
      currentTime <= layer.startTime + layer.duration
    ), [layers, currentTime]
  )

  // Sistema de cache para renderização de vídeo
  const renderVideoFrame = async (timestamp: number): Promise<Blob> => {
    // Simula renderização de frame de vídeo
    // Em uma implementação real, isso faria a renderização das camadas
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext('2d')!
      
      // Renderiza fundo
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      
      // Renderiza camadas visíveis no timestamp
      const layersAtTime = layers.filter(layer => 
        layer.visible && 
        timestamp >= layer.startTime && 
        timestamp <= layer.startTime + layer.duration
      )
      
      layersAtTime.forEach(layer => {
        if (layer.type === 'text' && layer.properties) {
          ctx.fillStyle = layer.properties.color || '#ffffff'
          ctx.font = `${layer.properties.fontSize || 16}px Arial`
          ctx.fillText(
            layer.properties.text || 'Texto',
            layer.properties.x || 0,
            (layer.properties.y || 0) + (layer.properties.fontSize || 16)
          )
        }
      })
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/jpeg', 0.8)
    })
  }

  const videoCache = useVideoCache({
    videoId: projectId,
    layerId: 'main-canvas',
    settings: { layers: layers.map(l => ({ id: l.id, properties: l.properties })) },
    renderFunction: renderVideoFrame,
    preloadEnabled: true,
    preloadRange: 2
  })

  // Controles de zoom
  const zoomIn = () => {
    setCanvasState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }))
  }

  const zoomOut = () => {
    setCanvasState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }))
  }

  const resetZoom = () => {
    setCanvasState(prev => ({ ...prev, zoom: 1, panX: 0, panY: 0 }))
  }

  const fitToScreen = () => {
    if (canvasRef.current) {
      const container = canvasRef.current.parentElement
      if (container) {
        const containerWidth = container.clientWidth - 40 // padding
        const containerHeight = container.clientHeight - 40
        
        const scaleX = containerWidth / canvasWidth
        const scaleY = containerHeight / canvasHeight
        const scale = Math.min(scaleX, scaleY, 1)
        
        setCanvasState(prev => ({ ...prev, zoom: scale, panX: 0, panY: 0 }))
      }
    }
  }

  // Manipular clique em camada
  const handleLayerClick = (event: React.MouseEvent, layerId: string) => {
    event.stopPropagation()
    onLayerSelect(layerId)
  }

  // Iniciar arraste de camada
  const handleLayerMouseDown = (event: React.MouseEvent, layerId: string) => {
    event.stopPropagation()
    const layer = layers.find(l => l.id === layerId)
    if (layer && !layer.locked) {
      setIsDragging(true)
      setDragLayer(layerId)
      setDragStart({ x: event.clientX, y: event.clientY })
      onLayerSelect(layerId)
    }
  }

  // Manipular movimento durante arraste
  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging && dragLayer) {
      const deltaX = (event.clientX - dragStart.x) / canvasState.zoom
      const deltaY = (event.clientY - dragStart.y) / canvasState.zoom
      
      const layer = layers.find(l => l.id === dragLayer)
      if (layer && layer.properties) {
        const newX = (layer.properties.x || 0) + deltaX
        const newY = (layer.properties.y || 0) + deltaY
        
        onLayerUpdate(dragLayer, {
          properties: {
            ...layer.properties,
            x: Math.max(0, Math.min(newX, canvasWidth - (layer.properties.width || 100))),
            y: Math.max(0, Math.min(newY, canvasHeight - (layer.properties.height || 50)))
          }
        })
        
        setDragStart({ x: event.clientX, y: event.clientY })
      }
    }
  }

  // Finalizar arraste
  const handleMouseUp = () => {
    setIsDragging(false)
    setDragLayer(null)
  }

  // Event listeners para arraste
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragLayer, dragStart])

  // Pré-carregamento de frames quando o tempo muda
  useEffect(() => {
    videoCache.preloadFrames(currentTime)
  }, [currentTime, videoCache])

  // Invalidar cache quando as camadas mudam
  useEffect(() => {
    videoCache.invalidateCache()
  }, [layers, videoCache])

  // Renderizar camada de texto
  const renderTextLayer = (layer: Layer) => {
    const props = layer.properties
    return (
      <div
        key={layer.id}
        className={`absolute cursor-move select-none ${
          selectedLayer === layer.id ? 'ring-2 ring-blue-400' : ''
        }`}
        style={{
          left: props.x || 0,
          top: props.y || 0,
          fontSize: props.fontSize || 16,
          color: props.color || '#ffffff',
          fontWeight: props.fontWeight || 'normal',
          textAlign: props.textAlign || 'left',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          zIndex: props.zIndex || 1
        }}
        onClick={(e) => handleLayerClick(e, layer.id)}
        onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
      >
        {props.text || 'Texto'}
        
        {/* Handles de redimensionamento para camada selecionada */}
        {selectedLayer === layer.id && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full cursor-nw-resize" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full cursor-ne-resize" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full cursor-sw-resize" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full cursor-se-resize" />
          </>
        )}
      </div>
    )
  }

  // Renderizar camada de imagem
  const renderImageLayer = (layer: Layer) => {
    const props = layer.properties
    return (
      <div
        key={layer.id}
        className={`absolute cursor-move ${
          selectedLayer === layer.id ? 'ring-2 ring-blue-400' : ''
        }`}
        style={{
          left: props.x || 0,
          top: props.y || 0,
          width: props.width || 200,
          height: props.height || 150,
          zIndex: props.zIndex || 1
        }}
        onClick={(e) => handleLayerClick(e, layer.id)}
        onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
      >
        {props.src ? (
          <img
            src={props.src}
            alt={layer.name}
            className="w-full h-full object-cover rounded"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gray-600 rounded flex items-center justify-center text-white text-sm">
            Imagem
          </div>
        )}
        
        {/* Handles de redimensionamento */}
        {selectedLayer === layer.id && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full cursor-nw-resize" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full cursor-ne-resize" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full cursor-sw-resize" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full cursor-se-resize" />
          </>
        )}
      </div>
    )
  }

  // Renderizar camada de vídeo/slide
  const renderVideoLayer = (layer: Layer) => {
    const props = layer.properties
    return (
      <div
        key={layer.id}
        className={`absolute cursor-move ${
          selectedLayer === layer.id ? 'ring-2 ring-blue-400' : ''
        }`}
        style={{
          left: props.x || 0,
          top: props.y || 0,
          width: props.width || canvasWidth,
          height: props.height || canvasHeight,
          zIndex: props.zIndex || 0
        }}
        onClick={(e) => handleLayerClick(e, layer.id)}
        onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
      >
        {props.src ? (
          <img
            src={props.src}
            alt={layer.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            Slide {layer.name}
          </div>
        )}
      </div>
    )
  }

  // Renderizar camada baseada no tipo
  const renderLayer = (layer: Layer) => {
    switch (layer.type) {
      case 'text':
        return renderTextLayer(layer)
      case 'image':
        return renderImageLayer(layer)
      case 'video':
        return renderVideoLayer(layer)
      default:
        return null
    }
  }

  return (
    <div ref={ref} className="flex-1 bg-gray-900 relative overflow-hidden">
      {/* Toolbar do Canvas */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2">
        <div className="bg-gray-800 rounded-lg p-2 flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-300 min-w-[60px] text-center">
            {Math.round(canvasState.zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-600" />
          <Button variant="ghost" size="sm" onClick={fitToScreen}>
            <Maximize className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetZoom}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-2 flex items-center space-x-2">
          <Button 
            variant={canvasState.showGrid ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setCanvasState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button 
            variant={canvasState.showGuides ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setCanvasState(prev => ({ ...prev, showGuides: !prev.showGuides }))}
          >
            <Crosshair className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info do tempo atual e cache */}
      <div className="absolute top-4 right-4 z-20 space-y-2">
        <div className="bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-300">
            {currentTime.toFixed(1)}s
          </span>
        </div>
        
        {/* Indicador de cache */}
        <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center space-x-2">
          {videoCache.isLoading && (
            <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
          )}
          <span className="text-xs text-gray-400">
            Cache: {Math.round(videoCache.cacheStats.size / 1024 / 1024)}MB
          </span>
        </div>
      </div>

      {/* Container do Canvas */}
      <div 
        ref={canvasRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          transform: `translate(${canvasState.panX}px, ${canvasState.panY}px)`
        }}
      >
        {/* Canvas Principal */}
        <div
          className="relative bg-black shadow-2xl"
          style={{
            width: canvasWidth * canvasState.zoom,
            height: canvasHeight * canvasState.zoom,
            transform: `scale(${canvasState.zoom})`,
            transformOrigin: 'center'
          }}
        >
          {/* Grid */}
          {canvasState.showGrid && (
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #374151 1px, transparent 1px),
                  linear-gradient(to bottom, #374151 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />
          )}
          
          {/* Guias centrais */}
          {canvasState.showGuides && (
            <>
              <div className="absolute top-1/2 left-0 w-full h-px bg-blue-400 opacity-30" />
              <div className="absolute left-1/2 top-0 w-px h-full bg-blue-400 opacity-30" />
            </>
          )}
          
          {/* Renderizar camadas visíveis */}
          {visibleLayers
            .sort((a, b) => (a.properties?.zIndex || 0) - (b.properties?.zIndex || 0))
            .map(renderLayer)
          }
          
          {/* Overlay para cliques no canvas vazio */}
          <div 
            className="absolute inset-0 cursor-default"
            onClick={() => onLayerSelect('')}
          />
        </div>
      </div>
      
      {/* Indicador de camadas não visíveis */}
      {layers.length > visibleLayers.length && (
        <div className="absolute bottom-4 left-4 z-20">
          <Badge variant="secondary" className="bg-gray-800">
            {visibleLayers.length} de {layers.length} camadas visíveis
          </Badge>
        </div>
      )}
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas