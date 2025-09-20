import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { List } from 'react-window'
import { toast } from 'sonner'
import { Lock, Film, Music, Type, Layers, Scissors, Copy, Trash2, Image } from 'lucide-react'
import { VideoClip as Clip } from '../VideoEditor'
import { Badge } from '../ui/badge'

// Função utilitária
const formatTime = (seconds: number, fps: number = 30): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * fps)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
}

// Interfaces
interface VirtualizedTimelineProps {
  tracks: ExtendedTrack[]
  currentTime: number
  duration: number
  fps: number
  pixelsPerSecond: number
  selectedClips: string[]
  selectedTracks: string[]
  showWaveforms: boolean
  showThumbnails: boolean
  showGrid: boolean
  snapEnabled: boolean
  onClipSelect: (clipId: string, addToSelection?: boolean) => void
  onTrackSelect: (trackId: string, addToSelection?: boolean) => void
  onClipMove: (clipId: string, newStartTime: number, newTrackId?: string) => void
  onClipResize: (clipId: string, newDuration: number, resizeStart?: boolean) => void
  onClipSplit: (clipId: string, splitTime: number) => void
  onSeek: (time: number) => void
  onZoom: (factor: number) => void
  className?: string
}

// Interface estendida para clips com propriedades adicionais
interface ExtendedClip extends Clip {
  locked?: boolean
  visible?: boolean
  properties?: {
    text?: string
    [key: string]: any
  }
  keyframes?: Array<{
    id: string
    time: number
    property: string
    value: any
    easing: string
  }>
}

// Interface estendida para tracks - usa any para evitar problemas de compatibilidade
interface ExtendedTrack {
  id: string
  name: string
  type: string
  height: number
  visible: boolean
  locked: boolean
  muted?: boolean
  solo?: boolean
  color: string
  clips: any[]
  effects?: any[]
}

interface ClipProperties {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  [key: string]: any
}

interface DragState {
  isDragging: boolean
  dragType: 'move' | 'resize-start' | 'resize-end' | 'select'
  dragClipId: string | null
  dragStartX: number
  dragStartTime: number
  originalStartTime: number
  originalDuration: number
}

interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
  visible: boolean
}

// Componente de Track Row para virtualização
interface TrackRowProps {
  index: number
  tracks: ExtendedTrack[]
  currentTime: number
  duration: number
  pixelsPerSecond: number
  selectedClips: string[]
  selectedTracks: string[]
  showWaveforms: boolean
  showThumbnails: boolean
  showGrid: boolean
  onClipSelect: (clipId: string, addToSelection?: boolean) => void
  onTrackSelect: (trackId: string, addToSelection?: boolean) => void
  onClipContextMenu: (clipId: string, event: React.MouseEvent) => void
  onClipDoubleClick: (clipId: string) => void
}

const TrackRow = ({ index, tracks, ...props }: TrackRowProps) => {
  const track = tracks[index]
  if (!track) return null
  
  const {
    currentTime,
    duration,
    pixelsPerSecond,
    selectedClips,
    selectedTracks,
    showWaveforms,
    showThumbnails,
    showGrid,
    onClipSelect,
    onTrackSelect,
    onClipContextMenu,
    onClipDoubleClick
  } = props

  const timelineWidth = duration * pixelsPerSecond

  const getClipIcon = (type: string) => {
    switch (type) {
      case 'video': return Film
      case 'audio': return Music
      case 'image': return Image
      case 'text': return Type
      default: return Layers
    }
  }

  const generateWaveform = (clip: Clip) => {
    // Gerar forma de onda simplificada
    const points = Math.floor(clip.duration * 20) // 20 pontos por segundo
    return Array.from({ length: points }, (_, i) => {
      const amplitude = Math.sin(i * 0.5) * 0.3 + Math.random() * 0.4 + 0.3
      return amplitude
    })
  }

  const generateThumbnails = (clip: Clip) => {
    // Gerar thumbnails simplificados
    const thumbCount = Math.max(1, Math.floor(clip.duration / 2))
    return Array.from({ length: thumbCount }, (_, i) => ({
      time: i * 2,
      url: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=video%20frame%20${i}&image_size=square`
    }))
  }

  return (
    <div className="relative">
      <div 
        className={`h-full border-b border-gray-700 relative cursor-pointer hover:bg-gray-800/50 ${
          selectedTracks.includes(track.id) ? 'bg-blue-900/30' : ''
        }`}
        onClick={() => onTrackSelect(track.id)}
      >
        {/* Grid lines */}
        {showGrid && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
              <line
                key={i}
                x1={i * pixelsPerSecond}
                y1={0}
                x2={i * pixelsPerSecond}
                y2={track.height}
                stroke="#374151"
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
          </svg>
        )}

        {/* Track background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ backgroundColor: track.color }}
        />

        {/* Clips */}
        {track.clips.map((clip) => {
          const ClipIcon = getClipIcon(clip.type)
          const clipWidth = clip.duration * pixelsPerSecond
          const clipLeft = clip.startTime * pixelsPerSecond
          
          return (
            <div
              key={clip.id}
              className={`absolute top-1 bottom-1 rounded border-2 cursor-pointer transition-all hover:brightness-110 overflow-hidden ${
                selectedClips.includes(clip.id)
                  ? 'border-blue-400 shadow-lg shadow-blue-400/50 z-10'
                  : 'border-gray-600 hover:border-gray-500'
              } ${
                clip.locked ? 'cursor-not-allowed opacity-75' : ''
              }`}
              style={{
                left: clipLeft,
                width: Math.max(clipWidth, 20), // Largura mínima
                backgroundColor: track.color,
                opacity: clip.visible ? (clip.opacity || 1) : 0.3
              }}
              onClick={(e) => {
                e.stopPropagation()
                onClipSelect(clip.id, e.ctrlKey || e.metaKey)
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                onClipContextMenu(clip.id, e)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                onClipDoubleClick(clip.id)
              }}
            >
              {/* Clip header */}
              <div className="h-6 bg-black bg-opacity-20 px-2 flex items-center justify-between text-xs text-white">
                <div className="flex items-center space-x-1 min-w-0">
                  {React.createElement(ClipIcon, { className: "w-3 h-3 flex-shrink-0" })}
                  <span className="truncate">{clip.name}</span>
                </div>
                {clip.locked && <Lock className="w-3 h-3 flex-shrink-0" />}
              </div>

              {/* Clip content */}
              <div className="flex-1 relative">
                {/* Thumbnails para vídeo/imagem */}
                {(clip.type === 'video' || clip.type === 'image') && showThumbnails && clipWidth > 60 && (
                  <div className="absolute inset-0 flex">
                    {generateThumbnails(clip).map((thumb, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gray-600 bg-opacity-50 border-r border-gray-500 last:border-r-0"
                        style={{
                          backgroundImage: `url(${thumb.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Waveform para áudio */}
                {clip.type === 'audio' && showWaveforms && (
                  <div className="absolute inset-x-1 bottom-1 top-6">
                    <svg className="w-full h-full">
                      {generateWaveform(clip).map((amplitude, i) => {
                        const x = (i / generateWaveform(clip).length) * clipWidth
                        const height = amplitude * (track.height - 30)
                        const y = (track.height - 30 - height) / 2
                        
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={y}
                            width={Math.max(1, clipWidth / generateWaveform(clip).length - 0.5)}
                            height={height}
                            fill={track.color}
                            opacity={0.8}
                          />
                        )
                      })}
                    </svg>
                  </div>
                )}

                {/* Texto para clips de texto */}
                {clip.type === 'text' && (
                  <div className="absolute inset-2 flex items-center justify-center text-center">
                    <div className="text-xs text-white font-medium truncate">
                      {clip.properties.text || 'Texto'}
                    </div>
                  </div>
                )}
              </div>

              {/* Clip footer com duração */}
              <div className="h-4 bg-black bg-opacity-20 px-2 flex items-center justify-between text-xs text-white opacity-75">
                <span>{formatTime(clip.duration, 30)}</span>
                {clip.speed !== 1 && (
                  <Badge variant="secondary" className="text-xs h-3 px-1">
                    {clip.speed}x
                  </Badge>
                )}
              </div>

              {/* Transitions */}
              {clip.transitions && clip.transitions.map((transition: any, i: number) => (
                <div
                  key={transition.id}
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent to-yellow-400 opacity-30 pointer-events-none"
                  style={{
                    left: i === 0 ? 0 : 'auto',
                    right: i === 0 ? 'auto' : 0,
                    width: transition.duration * pixelsPerSecond
                  }}
                />
              ))}

              {/* Keyframes */}
              {clip.keyframes && clip.keyframes.map((keyframe: any) => (
                <div
                  key={keyframe.id}
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-400 pointer-events-none"
                  style={{
                    left: (keyframe.time - clip.startTime) * pixelsPerSecond
                  }}
                >
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-400 rounded-full" />
                </div>
              ))}

              {/* Resize handles */}
              {!clip.locked && selectedClips.includes(clip.id) && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-400 opacity-0 hover:opacity-100 cursor-ew-resize" />
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-400 opacity-0 hover:opacity-100 cursor-ew-resize" />
                </>
              )}
            </div>
          )
        })}

        {/* Track effects indicator */}
        {track.effects && track.effects.length > 0 && (
          <div className="absolute top-1 right-1">
            <Badge variant="secondary" className="text-xs h-4 px-1">
              {track.effects.length} FX
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente principal
const VirtualizedTimeline: React.FC<VirtualizedTimelineProps> = ({
  tracks,
  currentTime,
  duration,
  fps,
  pixelsPerSecond,
  selectedClips,
  selectedTracks,
  showWaveforms,
  showThumbnails,
  showGrid,
  snapEnabled,
  onClipSelect,
  onTrackSelect,
  onClipMove,
  onClipResize,
  onClipSplit,
  onSeek,
  onZoom,
  className = ''
}) => {
  // Estados
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'select',
    dragClipId: null,
    dragStartX: 0,
    dragStartTime: 0,
    originalStartTime: 0,
    originalDuration: 0
  })

  const [selectionBox, setSelectionBox] = useState<SelectionBox>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    visible: false
  })

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    clipId: string | null
  }>({ visible: false, x: 0, y: 0, clipId: null })

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<any>(null)

  // Computed values
  const timelineWidth = useMemo(() => {
    return Math.max(duration * pixelsPerSecond, 1000)
  }, [duration, pixelsPerSecond])

  const trackHeight = 80 // Altura fixa para cada track
  const rulerHeight = 40

  // Funções utilitárias
  const snapToGrid = (time: number): number => {
    if (!snapEnabled) return time
    const snapInterval = 1 / fps // Snap to frames
    return Math.round(time / snapInterval) * snapInterval
  }

  const getTimeFromX = (x: number): number => {
    return Math.max(0, x / pixelsPerSecond)
  }

  const getXFromTime = (time: number): number => {
    return time * pixelsPerSecond
  }

  // Event handlers
  const handleClipContextMenu = useCallback((clipId: string, event: React.MouseEvent) => {
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      clipId
    })
  }, [])

  const handleClipDoubleClick = useCallback((clipId: string) => {
    // Abrir editor de propriedades do clip
    toast.info(`Editando propriedades do clip: ${clipId}`)
  }, [])

  const handleTimelineClick = useCallback((event: React.MouseEvent) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const time = snapToGrid(getTimeFromX(x))
    
    onSeek(Math.max(0, Math.min(time, duration)))
  }, [onSeek, duration, snapToGrid])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return // Apenas botão esquerdo
    
    const rect = timelineRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top - rulerHeight
    
    // Iniciar seleção múltipla
    setSelectionBox({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      visible: true
    })
  }, [])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!selectionBox.visible) return
    
    const rect = timelineRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top - rulerHeight
    
    setSelectionBox(prev => ({
      ...prev,
      endX: x,
      endY: y
    }))
  }, [selectionBox.visible])

  const handleMouseUp = useCallback(() => {
    if (selectionBox.visible) {
      // Finalizar seleção múltipla
      const minX = Math.min(selectionBox.startX, selectionBox.endX)
      const maxX = Math.max(selectionBox.startX, selectionBox.endX)
      const minY = Math.min(selectionBox.startY, selectionBox.endY)
      const maxY = Math.max(selectionBox.startY, selectionBox.endY)
      
      const startTime = getTimeFromX(minX)
      const endTime = getTimeFromX(maxX)
      const startTrack = Math.floor(minY / trackHeight)
      const endTrack = Math.floor(maxY / trackHeight)
      
      // Selecionar clips na área
      const selectedClipIds: string[] = []
      
      for (let trackIndex = startTrack; trackIndex <= endTrack && trackIndex < tracks.length; trackIndex++) {
        const track = tracks[trackIndex]
        track.clips.forEach(clip => {
          const clipStart = clip.startTime
          const clipEnd = clip.startTime + clip.duration
          
          if (clipStart < endTime && clipEnd > startTime) {
            selectedClipIds.push(clip.id)
          }
        })
      }
      
      // Atualizar seleção
      selectedClipIds.forEach(clipId => onClipSelect(clipId, true))
      
      setSelectionBox(prev => ({ ...prev, visible: false }))
    }
  }, [selectionBox, tracks, onClipSelect, getTimeFromX])

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Zoom
      event.preventDefault()
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
      onZoom(zoomFactor)
    }
  }, [onZoom])

  // Fechar menu de contexto
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }))
    }
    
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
    return undefined
  }, [contextMenu.visible])

  // Data para o componente virtualizado
  const listData = useMemo(() => ({
    tracks,
    currentTime,
    duration,
    pixelsPerSecond,
    selectedClips,
    selectedTracks,
    showWaveforms,
    showThumbnails,
    showGrid,
    onClipSelect,
    onTrackSelect,
    onClipContextMenu: handleClipContextMenu,
    onClipDoubleClick: handleClipDoubleClick
  }), [
    tracks,
    currentTime,
    duration,
    pixelsPerSecond,
    selectedClips,
    selectedTracks,
    showWaveforms,
    showThumbnails,
    showGrid,
    onClipSelect,
    onTrackSelect,
    handleClipContextMenu,
    handleClipDoubleClick
  ])

  return (
    <div className={`relative bg-gray-900 ${className}`}>
      {/* Ruler */}
      <div className="h-10 bg-gray-700 border-b border-gray-600 relative overflow-hidden">
        <div 
          className="h-full relative cursor-pointer"
          style={{ width: timelineWidth }}
          onClick={handleTimelineClick}
        >
          <svg className="w-full h-full">
            {/* Major ticks (seconds) */}
            {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
              <g key={`major-${i}`}>
                <line
                  x1={i * pixelsPerSecond}
                  y1={0}
                  x2={i * pixelsPerSecond}
                  y2={40}
                  stroke="#6b7280"
                  strokeWidth={1}
                />
                <text
                  x={i * pixelsPerSecond + 4}
                  y={25}
                  fill="#9ca3af"
                  fontSize={12}
                  fontFamily="monospace"
                >
                  {formatTime(i, 30)}
                </text>
              </g>
            ))}
            
            {/* Minor ticks (frames) */}
            {pixelsPerSecond > 30 && Array.from({ length: Math.ceil(duration * fps) }, (_, i) => {
              const time = i / fps
              if (time % 1 !== 0) { // Não desenhar nos segundos
                return (
                  <line
                    key={`minor-${i}`}
                    x1={time * pixelsPerSecond}
                    y1={30}
                    x2={time * pixelsPerSecond}
                    y2={40}
                    stroke="#4b5563"
                    strokeWidth={0.5}
                  />
                )
              }
              return null
            })}
          </svg>
          
          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ left: currentTime * pixelsPerSecond }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          </div>
        </div>
      </div>
      
      {/* Timeline content */}
      <div 
        ref={timelineRef}
        className="relative overflow-auto"
        style={{ height: 'calc(100% - 40px)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Virtualized track list */}
        <List
          rowCount={tracks.length}
          rowHeight={trackHeight}
          rowComponent={TrackRow}
          rowProps={{
            tracks,
            currentTime,
            duration,
            pixelsPerSecond,
            selectedClips,
            selectedTracks,
            showWaveforms,
            showThumbnails,
            showGrid,
            onClipSelect,
            onTrackSelect,
            onClipContextMenu: (clipId: string, event: React.MouseEvent) => {
              event.preventDefault()
              setContextMenu({
                visible: true,
                x: event.clientX,
                y: event.clientY,
                clipId
              })
            },
            onClipDoubleClick: (clipId: string) => {
              onClipSplit(clipId, currentTime)
            }
          }}
          style={{ height: Math.min(tracks.length * trackHeight, 600), width: "100%" }}
        />
        
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
          style={{ left: currentTime * pixelsPerSecond }}
        />
        
        {/* Selection box */}
        {selectionBox.visible && (
          <div
            className="absolute border-2 border-blue-400 bg-blue-400 bg-opacity-20 pointer-events-none z-40"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.endX),
              top: Math.min(selectionBox.startY, selectionBox.endY),
              width: Math.abs(selectionBox.endX - selectionBox.startX),
              height: Math.abs(selectionBox.endY - selectionBox.startY)
            }}
          />
        )}
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
          <button 
            className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center space-x-2"
            onClick={() => {
              if (contextMenu.clipId) {
                onClipSplit(contextMenu.clipId, currentTime)
              }
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Scissors className="w-4 h-4" />
            <span>Dividir</span>
          </button>
          <button 
            className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center space-x-2"
            onClick={() => {
              if (contextMenu.clipId) {
                onClipSelect(contextMenu.clipId)
                // Copy clip logic
              }
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Copy className="w-4 h-4" />
            <span>Copiar</span>
          </button>
          <button 
            className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center space-x-2 text-red-400"
            onClick={() => {
              if (contextMenu.clipId) {
                // Delete clip logic
              }
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default VirtualizedTimeline