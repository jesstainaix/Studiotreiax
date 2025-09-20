import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
  Layers,
  Clock,
  Scissors,
  Copy,
  Trash2
} from 'lucide-react'
import { timelineSystem, type TimelineItem, type TimelineTrack } from '@/lib/timeline/timeline-system'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TimelineEditorProps {
  projectId: string
  onTimelineChange?: (timeline: TimelineItem[]) => void
  className?: string
}

interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
}

interface SelectionState {
  selectedItems: string[]
  selectedTrack: string | null
  draggedItem: string | null
}

const TRACK_COLORS = {
  video: 'bg-blue-100 border-blue-300',
  audio: 'bg-green-100 border-green-300',
  text: 'bg-purple-100 border-purple-300',
  avatar: 'bg-orange-100 border-orange-300',
  effects: 'bg-pink-100 border-pink-300'
}

const TRACK_ICONS = {
  video: '🎬',
  audio: '🎵',
  text: '📝',
  avatar: '👤',
  effects: '✨'
}

export default function TimelineEditor({ projectId, onTimelineChange, className }: TimelineEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [tracks, setTracks] = useState<TimelineTrack[]>([])
  const [items, setItems] = useState<TimelineItem[]>([])
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 300, // 5 minutes default
    volume: 1,
    isMuted: false
  })
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedItems: [],
    selectedTrack: null,
    draggedItem: null
  })
  const [zoom, setZoom] = useState(1)
  const [scrollPosition, setScrollPosition] = useState(0)

  // Initialize timeline system
  useEffect(() => {
    const initializeTimeline = async () => {
      try {
        if (canvasRef.current) {
          await timelineSystem.initialize(canvasRef.current)
          
          // Create default tracks
          const defaultTracks: TimelineTrack[] = [
            { id: 'video-1', name: 'Video Principal', type: 'video', height: 80, locked: false, visible: true },
            { id: 'audio-1', name: 'Narração', type: 'audio', height: 60, locked: false, visible: true },
            { id: 'text-1', name: 'Legendas', type: 'text', height: 50, locked: false, visible: true },
            { id: 'avatar-1', name: 'Avatar', type: 'avatar', height: 70, locked: false, visible: true },
            { id: 'effects-1', name: 'Efeitos', type: 'effects', height: 40, locked: false, visible: true }
          ]
          
          setTracks(defaultTracks)
          setIsInitialized(true)
          
          // Load existing timeline data if available
          await loadTimelineData()
          
          toast.success('Timeline inicializada com sucesso!')
        }
      } catch (error) {
        console.error('Erro ao inicializar timeline:', error)
        toast.error('Erro ao inicializar timeline')
      }
    }

    initializeTimeline()

    return () => {
      timelineSystem.destroy()
    }
  }, [projectId])

  // Load timeline data for project
  const loadTimelineData = async () => {
    try {
      // Simulate loading timeline data
      const mockItems: TimelineItem[] = [
        {
          id: 'item-1',
          trackId: 'video-1',
          startTime: 0,
          duration: 120,
          type: 'video',
          content: {
            name: 'Slide 1 - Introdução',
            thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20training%20introduction%20slide&image_size=landscape_16_9'
          },
          locked: false,
          visible: true
        },
        {
          id: 'item-2',
          trackId: 'audio-1',
          startTime: 0,
          duration: 120,
          type: 'audio',
          content: {
            name: 'Narração - Introdução',
            waveform: true
          },
          locked: false,
          visible: true
        },
        {
          id: 'item-3',
          trackId: 'text-1',
          startTime: 10,
          duration: 30,
          type: 'text',
          content: {
            name: 'Título: Segurança no Trabalho',
            text: 'Segurança no Trabalho'
          },
          locked: false,
          visible: true
        }
      ]
      
      setItems(mockItems)
      
      // Add items to timeline system
      for (const item of mockItems) {
        await timelineSystem.addItem(item)
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados da timeline:', error)
    }
  }

  // Playback controls
  const handlePlay = useCallback(() => {
    if (playbackState.isPlaying) {
      timelineSystem.pause()
      setPlaybackState(prev => ({ ...prev, isPlaying: false }))
    } else {
      timelineSystem.play()
      setPlaybackState(prev => ({ ...prev, isPlaying: true }))
    }
  }, [playbackState.isPlaying])

  const handleStop = useCallback(() => {
    timelineSystem.stop()
    setPlaybackState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentTime: 0 
    }))
  }, [])

  const handleSeek = useCallback((time: number) => {
    timelineSystem.seek(time)
    setPlaybackState(prev => ({ ...prev, currentTime: time }))
  }, [])

  const handleVolumeChange = useCallback((volume: number[]) => {
    const newVolume = volume[0]
    setPlaybackState(prev => ({ ...prev, volume: newVolume }))
  }, [])

  const toggleMute = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isMuted: !prev.isMuted }))
  }, [])

  // Timeline manipulation
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectionState(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemId)
        ? prev.selectedItems.filter(id => id !== itemId)
        : [...prev.selectedItems, itemId]
    }))
  }, [])

  const handleItemDelete = useCallback(async () => {
    try {
      for (const itemId of selectionState.selectedItems) {
        await timelineSystem.removeItem(itemId)
        setItems(prev => prev.filter(item => item.id !== itemId))
      }
      setSelectionState(prev => ({ ...prev, selectedItems: [] }))
      toast.success('Itens removidos da timeline')
    } catch (error) {
      console.error('Erro ao remover itens:', error)
      toast.error('Erro ao remover itens')
    }
  }, [selectionState.selectedItems])

  const handleItemDuplicate = useCallback(async () => {
    try {
      const newItems: TimelineItem[] = []
      
      for (const itemId of selectionState.selectedItems) {
        const originalItem = items.find(item => item.id === itemId)
        if (originalItem) {
          const duplicatedItem: TimelineItem = {
            ...originalItem,
            id: `${originalItem.id}-copy-${Date.now()}`,
            startTime: originalItem.startTime + originalItem.duration + 1
          }
          
          await timelineSystem.addItem(duplicatedItem)
          newItems.push(duplicatedItem)
        }
      }
      
      setItems(prev => [...prev, ...newItems])
      toast.success('Itens duplicados na timeline')
    } catch (error) {
      console.error('Erro ao duplicar itens:', error)
      toast.error('Erro ao duplicar itens')
    }
  }, [selectionState.selectedItems, items])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate item position and width based on zoom
  const getItemStyle = (item: TimelineItem) => {
    const pixelsPerSecond = 10 * zoom
    const left = item.startTime * pixelsPerSecond
    const width = item.duration * pixelsPerSecond
    
    return {
      left: `${left}px`,
      width: `${Math.max(width, 50)}px`
    }
  }

  // Get track height
  const getTrackHeight = (track: TimelineTrack) => {
    return `${track.height}px`
  }

  if (!isInitialized) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Inicializando Timeline...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {formatTime(playbackState.currentTime)} / {formatTime(playbackState.duration)}
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSeek(Math.max(0, playbackState.currentTime - 10))}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant={playbackState.isPlaying ? "default" : "outline"}
              size="sm"
              onClick={handlePlay}
            >
              {playbackState.isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleStop}>
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSeek(Math.min(playbackState.duration, playbackState.currentTime + 10))}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleMute}>
                {playbackState.isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[playbackState.isMuted ? 0 : playbackState.volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Zoom Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Zoom:</span>
              <div className="w-20">
                <Slider
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="relative">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-100"
              style={{ width: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
            />
          </div>
          <div 
            className="absolute top-0 w-0.5 h-2 bg-red-500 transition-all duration-100"
            style={{ left: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
          />
        </div>

        {/* Selection Tools */}
        {selectionState.selectedItems.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">
              {selectionState.selectedItems.length} item(s) selecionado(s)
            </span>
            <Button variant="outline" size="sm" onClick={handleItemDuplicate}>
              <Copy className="h-4 w-4 mr-1" />
              Duplicar
            </Button>
            <Button variant="outline" size="sm" onClick={handleItemDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        )}

        {/* Timeline Tracks */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex">
            {/* Track Headers */}
            <div className="w-48 bg-gray-50 border-r">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={cn(
                    "flex items-center gap-2 p-3 border-b cursor-pointer hover:bg-gray-100",
                    selectionState.selectedTrack === track.id && "bg-blue-50"
                  )}
                  style={{ height: getTrackHeight(track) }}
                  onClick={() => setSelectionState(prev => ({ 
                    ...prev, 
                    selectedTrack: track.id 
                  }))}
                >
                  <span className="text-lg">{TRACK_ICONS[track.type]}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{track.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{track.type}</div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Layers className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Timeline Content */}
            <div className="flex-1 relative overflow-x-auto" ref={timelineRef}>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={cn(
                    "relative border-b",
                    TRACK_COLORS[track.type]
                  )}
                  style={{ height: getTrackHeight(track) }}
                >
                  {/* Track Items */}
                  {items
                    .filter(item => item.trackId === track.id)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "absolute top-1 bottom-1 bg-white border-2 rounded cursor-pointer transition-all",
                          "hover:shadow-md",
                          selectionState.selectedItems.includes(item.id) 
                            ? "border-blue-500 shadow-lg" 
                            : "border-gray-300"
                        )}
                        style={getItemStyle(item)}
                        onClick={() => handleItemSelect(item.id)}
                      >
                        <div className="p-2 h-full overflow-hidden">
                          <div className="text-xs font-medium truncate">
                            {item.content.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(item.duration)}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas for Fabric.js */}
        <div className="hidden">
          <canvas ref={canvasRef} width={800} height={600} />
        </div>
      </CardContent>
    </Card>
  )
}