import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  GripVertical,
  Plus,
  Copy,
  Type,
  Image,
  Music,
  Video,
  Square,
  Mic
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

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

interface LayersPanelProps {
  layers: Layer[]
  selectedLayer: string | null
  onLayerSelect: (layerId: string) => void
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void
  onLayerDelete: (layerId: string) => void
  onLayerReorder?: (layers: Layer[]) => void
  onLayerAdd?: (type: Layer['type']) => void
  onLayerDuplicate?: (layerId: string) => void
  onTextSelect?: (text: string) => void
}

const getLayerIcon = (type: Layer['type']) => {
  switch (type) {
    case 'text': return <Type className="w-4 h-4" />
    case 'image': return <Image className="w-4 h-4" />
    case 'audio': return <Music className="w-4 h-4" />
    case 'video': return <Video className="w-4 h-4" />
    case 'shape': return <Square className="w-4 h-4" />
    default: return <Square className="w-4 h-4" />
  }
}

const getLayerTypeColor = (type: Layer['type']) => {
  switch (type) {
    case 'text': return 'bg-blue-500'
    case 'image': return 'bg-green-500'
    case 'audio': return 'bg-purple-500'
    case 'video': return 'bg-red-500'
    case 'shape': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
}

export default function LayersPanel({
  layers,
  selectedLayer,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
  onLayerReorder,
  onLayerAdd,
  onLayerDuplicate,
  onTextSelect
}: LayersPanelProps) {
  const [editingLayer, setEditingLayer] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onLayerReorder) return

    const items = Array.from(layers)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onLayerReorder(items)
  }

  const toggleVisibility = (layerId: string, visible: boolean) => {
    onLayerUpdate(layerId, { visible: !visible })
  }

  const toggleLock = (layerId: string, locked: boolean) => {
    onLayerUpdate(layerId, { locked: !locked })
  }

  const startEditing = (layer: Layer) => {
    setEditingLayer(layer.id)
    setEditingName(layer.name)
  }

  const finishEditing = () => {
    if (editingLayer && editingName.trim()) {
      onLayerUpdate(editingLayer, { name: editingName.trim() })
    }
    setEditingLayer(null)
    setEditingName('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing()
    } else if (e.key === 'Escape') {
      setEditingLayer(null)
      setEditingName('')
    }
  }

  const formatDuration = (duration: number) => {
    return `${duration.toFixed(1)}s`
  }

  return (
    <Card className="h-full bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm">Camadas</CardTitle>
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={() => onLayerAdd?.('text')}
              title="Adicionar Texto"
            >
              <Type className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={() => onLayerAdd?.('image')}
              title="Adicionar Imagem"
            >
              <Image className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={() => onLayerAdd?.('audio')}
              title="Adicionar Áudio"
            >
              <Music className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layers">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1 p-2"
              >
                {layers.map((layer, index) => (
                  <Draggable key={layer.id} draggableId={layer.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          group relative bg-gray-700 rounded-lg border transition-all duration-200
                          ${selectedLayer === layer.id 
                            ? 'border-blue-500 bg-gray-600' 
                            : 'border-gray-600 hover:border-gray-500'
                          }
                          ${snapshot.isDragging ? 'shadow-lg scale-105' : ''}
                          ${!layer.visible ? 'opacity-50' : ''}
                        `}
                        onClick={() => onLayerSelect(layer.id)}
                      >
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-3 h-3 text-gray-400" />
                        </div>

                        <div className="flex items-center p-2 pl-6">
                          {/* Layer Icon & Type */}
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${getLayerTypeColor(layer.type)}`}>
                              {getLayerIcon(layer.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {editingLayer === layer.id ? (
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onBlur={finishEditing}
                                  onKeyDown={handleKeyPress}
                                  className="h-6 text-xs bg-gray-600 border-gray-500"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="text-sm text-white truncate cursor-pointer"
                                  onDoubleClick={() => startEditing(layer)}
                                  title={layer.name}
                                >
                                  {layer.name}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  {formatDuration(layer.duration)}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {layer.startTime.toFixed(1)}s
                                </span>
                              </div>
                              
                              {layer.type === 'text' && layer.properties?.text && (
                                <div className="text-xs text-blue-400 mt-1 truncate">
                                  "{layer.properties.text}"
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Layer Controls */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {layer.type === 'text' && layer.properties?.text && onTextSelect && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onTextSelect(layer.properties.text)
                                }}
                                title="Usar texto no TTS"
                              >
                                <Mic className="w-3 h-3" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleVisibility(layer.id, layer.visible)
                              }}
                              title={layer.visible ? 'Ocultar' : 'Mostrar'}
                            >
                              {layer.visible ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-gray-500" />
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLock(layer.id, layer.locked)
                              }}
                              title={layer.locked ? 'Desbloquear' : 'Bloquear'}
                            >
                              {layer.locked ? (
                                <Lock className="w-3 h-3 text-yellow-500" />
                              ) : (
                                <Unlock className="w-3 h-3" />
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                onLayerDuplicate?.(layer.id)
                              }}
                              title="Duplicar"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                onLayerDelete(layer.id)
                              }}
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Lock Indicator */}
                        {layer.locked && (
                          <div className="absolute top-1 right-1">
                            <Lock className="w-3 h-3 text-yellow-500" />
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {layers.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <div className="mb-2">
              <Plus className="w-8 h-8 mx-auto opacity-50" />
            </div>
            <p className="text-sm">Nenhuma camada adicionada</p>
            <p className="text-xs mt-1">Clique nos ícones acima para adicionar elementos</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}