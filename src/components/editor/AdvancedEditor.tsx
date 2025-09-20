import React, { useEffect, useRef, useState, useCallback } from 'react'
import { FabricCanvasManager, CanvasElement } from '../../lib/fabric/fabric-canvas'
import { LayerManager, LayerElement } from '../../lib/layers/layer-manager'
import { TimelineSystem } from '../../lib/timeline/timeline-system'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  ZoomIn, 
  ZoomOut,
  Layers,
  Clock,
  Settings,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react'
import { toast } from 'sonner'

interface AdvancedEditorProps {
  width?: number
  height?: number
  onElementAdded?: (element: CanvasElement) => void
  onElementRemoved?: (elementId: string) => void
  onTimelineUpdate?: (currentTime: number) => void
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  width = 1920,
  height = 1080,
  onElementAdded,
  onElementRemoved,
  onTimelineUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricManagerRef = useRef<FabricCanvasManager | null>(null)
  const layerManagerRef = useRef<LayerManager | null>(null)
  const timelineSystemRef = useRef<TimelineSystem | null>(null)
  
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30000) // 30 seconds
  const [zoom, setZoom] = useState(1)
  const [elementCount, setElementCount] = useState(0)
  const [maxElements] = useState(50)
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    elementCount: 0,
    frameRate: 0
  })
  const [layers, setLayers] = useState<LayerElement[]>([])
  const [activeTab, setActiveTab] = useState('canvas')

  // Initialize all systems
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        if (!canvasRef.current) return

        // Initialize Fabric Canvas Manager
        fabricManagerRef.current = new FabricCanvasManager(canvasRef.current, {
          width,
          height,
          backgroundColor: '#000000'
        })

        // Initialize Layer Manager
        layerManagerRef.current = new LayerManager()

        // Initialize Timeline System
        timelineSystemRef.current = new TimelineSystem({
          duration,
          frameRate: 30,
          onTimeUpdate: (time) => {
            setCurrentTime(time)
            onTimelineUpdate?.(time)
          }
        })

        setIsInitialized(true)
  toast.success('Editor avançado inicializado com sucesso.')
      } catch (error) {
  console.error('Falha ao inicializar o editor avançado:', error)
  toast.error('Não foi possível inicializar o editor avançado. Tente novamente.')
      }
    }

    initializeSystems()

    return () => {
      // Cleanup
      fabricManagerRef.current?.dispose()
      timelineSystemRef.current?.dispose()
    }
  }, [width, height, duration, onTimelineUpdate])

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (!timelineSystemRef.current) return

    if (isPlaying) {
      timelineSystemRef.current.pause()
      setIsPlaying(false)
    } else {
      timelineSystemRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  // Handle stop
  const handleStop = useCallback(() => {
    if (!timelineSystemRef.current) return

    timelineSystemRef.current.stop()
    setIsPlaying(false)
    setCurrentTime(0)
  }, [])

  // Handle zoom
  const handleZoom = useCallback((newZoom: number[]) => {
    const zoomValue = newZoom[0]
    setZoom(zoomValue)
    fabricManagerRef.current?.setZoom(zoomValue)
  }, [])

  // Add element
  const handleAddElement = useCallback((type: string) => {
    if (!fabricManagerRef.current || !layerManagerRef.current) return
    if (elementCount >= maxElements) {
  toast.error(`Limite de ${maxElements} elementos atingido.`)
      return
    }

    try {
      const element = fabricManagerRef.current.addElement(type, {
        left: Math.random() * (width - 100),
        top: Math.random() * (height - 100)
      })

      const layer = layerManagerRef.current.addLayer({
        id: element.id,
        name: `${type} ${elementCount + 1}`,
        type,
        visible: true,
        locked: false,
        opacity: 1
      })

      setElementCount(prev => prev + 1)
      setLayers(layerManagerRef.current.getLayers())
      onElementAdded?.(element)
  toast.success(`Elemento do tipo "${type}" adicionado.`)
    } catch (error) {
  console.error('Falha ao adicionar elemento:', error)
  toast.error('Não foi possível adicionar o elemento. Tente novamente.')
    }
  }, [elementCount, maxElements, width, height, onElementAdded])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando o editor avançado…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            <Square className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-sm text-gray-300">Zoom:</span>
            <Slider
              value={[zoom]}
              onValueChange={handleZoom}
              min={0.1}
              max={3}
              step={0.1}
              className="w-24"
            />
            <span className="text-sm text-gray-300">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {elementCount}/{maxElements} elementos
          </Badge>
          <Badge variant="outline">
            {Math.round(currentTime / 1000)}s / {Math.round(duration / 1000)}s
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-900">
          <div className="relative border border-gray-600 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="max-w-full max-h-full"
              style={{
                transform: `scale(${Math.min(1, 800 / width, 600 / height)})`,
                transformOrigin: 'top left'
              }}
            />
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="canvas" className="text-xs">
                <Settings className="w-4 h-4 mr-1" />
                Canvas
              </TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">
                <Layers className="w-4 h-4 mr-1" />
                Camadas
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">
                <Clock className="w-4 h-4 mr-1" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="canvas" className="p-4 space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Adicionar Elementos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => handleAddElement('text')}
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Texto
                  </Button>
                  <Button
                    onClick={() => handleAddElement('rectangle')}
                    className="w-full justify-start bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Retângulo
                  </Button>
                  <Button
                    onClick={() => handleAddElement('circle')}
                    className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Círculo
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layers" className="p-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Camadas ({layers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {layers.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhuma camada criada</p>
                  ) : (
                    <div className="space-y-1">
                      {layers.map((layer) => (
                        <div
                          key={layer.id}
                          className="flex items-center justify-between p-2 bg-gray-600 rounded text-sm"
                        >
                          <span className="text-white">{layer.name}</span>
                          <div className="flex items-center space-x-1">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="p-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Tempo Atual</span>
                      <span>{Math.round(currentTime / 1000)}s</span>
                    </div>
                    <Slider
                      value={[currentTime]}
                      onValueChange={(value) => {
                        setCurrentTime(value[0])
                        timelineSystemRef.current?.seekTo(value[0])
                      }}
                      min={0}
                      max={duration}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>0s</span>
                      <span>{Math.round(duration / 1000)}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default AdvancedEditor