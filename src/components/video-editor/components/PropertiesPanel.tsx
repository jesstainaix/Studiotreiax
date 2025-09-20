import React, { useState } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Slider } from '../../ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Checkbox } from '../../ui/checkbox'
import { 
  Settings, 
  Palette, 
  Volume2, 
  Clock, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  RotateCw,
  Move,
  Maximize
} from 'lucide-react'
import type { VideoScene, SceneElement } from '../VideoEditorStudio'

interface PropertiesPanelProps {
  scene: VideoScene
  selectedElements: string[]
  onUpdateScene: (updates: Partial<VideoScene>) => void
  onUpdateElement: (elementId: string, updates: Partial<SceneElement>) => void
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  scene,
  selectedElements,
  onUpdateScene,
  onUpdateElement
}) => {
  const [activeTab, setActiveTab] = useState('scene')
  
  const selectedElement = selectedElements.length === 1 
    ? scene.elements.find(el => el.id === selectedElements[0])
    : null

  const renderSceneProperties = () => (
    <div className="space-y-6">
      {/* Scene Info */}
      <div className="property-group">
        <Label className="text-sm font-semibold text-gray-300">Informações da Cena</Label>
        <div className="space-y-3 mt-2">
          <div>
            <Label htmlFor="scene-title" className="text-xs text-gray-400">Título</Label>
            <Input
              id="scene-title"
              value={scene.title}
              onChange={(e) => onUpdateScene({ title: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="scene-duration" className="text-xs text-gray-400">Duração (segundos)</Label>
            <Input
              id="scene-duration"
              type="number"
              value={scene.duration}
              onChange={(e) => onUpdateScene({ duration: Number(e.target.value) })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>
      </div>

      {/* Background */}
      <div className="property-group">
        <Label className="text-sm font-semibold text-gray-300">Fundo da Cena</Label>
        <div className="space-y-3 mt-2">
          <div>
            <Label htmlFor="bg-type" className="text-xs text-gray-400">Tipo</Label>
            <Select value={scene.background.type} onValueChange={(value: any) => 
              onUpdateScene({ 
                background: { ...scene.background, type: value }
              })
            }>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="color">Cor Sólida</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="3d-environment">Ambiente 3D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scene.background.type === 'color' && (
            <div>
              <Label htmlFor="bg-color" className="text-xs text-gray-400">Cor</Label>
              <Input
                id="bg-color"
                type="color"
                value={scene.background.value}
                onChange={(e) => onUpdateScene({ 
                  background: { ...scene.background, value: e.target.value }
                })}
                className="bg-gray-700 border-gray-600 h-10"
              />
            </div>
          )}

          {scene.background.type === 'image' && (
            <div>
              <Label htmlFor="bg-image" className="text-xs text-gray-400">Imagem URL</Label>
              <Input
                id="bg-image"
                value={scene.background.value}
                onChange={(e) => onUpdateScene({ 
                  background: { ...scene.background, value: e.target.value }
                })}
                placeholder="https://exemplo.com/imagem.jpg"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs text-white border-gray-600 hover:bg-gray-700"
              >
                Escolher Arquivo
              </Button>
            </div>
          )}

          <div>
            <Label htmlFor="bg-opacity" className="text-xs text-gray-400">
              Opacidade: {Math.round(scene.background.opacity * 100)}%
            </Label>
            <Slider
              id="bg-opacity"
              min={0}
              max={1}
              step={0.01}
              value={[scene.background.opacity]}
              onValueChange={(value) => onUpdateScene({ 
                background: { ...scene.background, opacity: value[0] }
              })}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="property-group">
        <Label className="text-sm font-semibold text-gray-300">Avatar 3D</Label>
        <div className="space-y-3 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="avatar-enabled"
              checked={!!scene.avatar}
              onCheckedChange={(checked) => {
                if (checked) {
                  onUpdateScene({
                    avatar: {
                      id: 'default-avatar',
                      model: 'instructor-professional',
                      position: { x: 100, y: 100, z: 0 },
                      rotation: { x: 0, y: 0, z: 0 },
                      scale: { x: 1, y: 1, z: 1 },
                      animation: 'idle',
                      clothing: {
                        style: 'professional',
                        colors: ['#1f4e79', '#ffffff']
                      },
                      expressions: {
                        current: 'neutral',
                        available: ['neutral', 'smile', 'serious', 'explaining']
                      }
                    }
                  })
                } else {
                  onUpdateScene({ avatar: undefined })
                }
              }}
            />
            <Label htmlFor="avatar-enabled" className="text-xs text-gray-400">
              Mostrar Avatar
            </Label>
          </div>

          {scene.avatar && (
            <>
              <div>
                <Label htmlFor="avatar-model" className="text-xs text-gray-400">Modelo</Label>
                <Select value={scene.avatar.model} onValueChange={(value) => 
                  onUpdateScene({ 
                    avatar: { ...scene.avatar!, model: value }
                  })
                }>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="instructor-male">Instrutor Masculino</SelectItem>
                    <SelectItem value="instructor-female">Instrutora Feminina</SelectItem>
                    <SelectItem value="safety-male">Técnico de Segurança</SelectItem>
                    <SelectItem value="safety-female">Técnica de Segurança</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="avatar-style" className="text-xs text-gray-400">Estilo</Label>
                <Select value={scene.avatar.clothing.style} onValueChange={(value: any) => 
                  onUpdateScene({ 
                    avatar: { 
                      ...scene.avatar!, 
                      clothing: { ...scene.avatar!.clothing, style: value }
                    }
                  })
                }>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="safety">Segurança</SelectItem>
                    <SelectItem value="medical">Médico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="avatar-animation" className="text-xs text-gray-400">Animação</Label>
                <Select value={scene.avatar.animation} onValueChange={(value) => 
                  onUpdateScene({ 
                    avatar: { ...scene.avatar!, animation: value }
                  })
                }>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="idle">Parado</SelectItem>
                    <SelectItem value="talking">Falando</SelectItem>
                    <SelectItem value="pointing">Apontando</SelectItem>
                    <SelectItem value="explaining">Explicando</SelectItem>
                    <SelectItem value="warning">Alertando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transitions */}
      <div className="property-group">
        <Label className="text-sm font-semibold text-gray-300">Transições</Label>
        <div className="space-y-3 mt-2">
          <div>
            <Label htmlFor="transition-in" className="text-xs text-gray-400">Entrada</Label>
            <Select value={scene.transitions.in.type} onValueChange={(value: any) => 
              onUpdateScene({ 
                transitions: { 
                  ...scene.transitions, 
                  in: { ...scene.transitions.in, type: value }
                }
              })
            }>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="dissolve">Dissolve</SelectItem>
                <SelectItem value="none">Nenhuma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="transition-duration" className="text-xs text-gray-400">
              Duração: {scene.transitions.in.duration}s
            </Label>
            <Slider
              id="transition-duration"
              min={0.1}
              max={3}
              step={0.1}
              value={[scene.transitions.in.duration]}
              onValueChange={(value) => onUpdateScene({ 
                transitions: { 
                  ...scene.transitions, 
                  in: { ...scene.transitions.in, duration: value[0] }
                }
              })}
              className="mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderElementProperties = () => {
    if (!selectedElement) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <p className="text-sm">Selecione um elemento para editar</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Element Info */}
        <div className="property-group">
          <Label className="text-sm font-semibold text-gray-300">Elemento</Label>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Tipo: {selectedElement.type}</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateElement(selectedElement.id, { visible: !selectedElement.visible })}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  {selectedElement.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateElement(selectedElement.id, { locked: !selectedElement.locked })}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  {selectedElement.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Transform */}
        <div className="property-group">
          <Label className="text-sm font-semibold text-gray-300 flex items-center">
            <Move className="w-4 h-4 mr-2" />
            Transformação
          </Label>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pos-x" className="text-xs text-gray-400">X</Label>
                <Input
                  id="pos-x"
                  type="number"
                  value={selectedElement.position.x}
                  onChange={(e) => onUpdateElement(selectedElement.id, { 
                    position: { ...selectedElement.position, x: Number(e.target.value) }
                  })}
                  className="bg-gray-700 border-gray-600 text-white text-xs"
                />
              </div>
              <div>
                <Label htmlFor="pos-y" className="text-xs text-gray-400">Y</Label>
                <Input
                  id="pos-y"
                  type="number"
                  value={selectedElement.position.y}
                  onChange={(e) => onUpdateElement(selectedElement.id, { 
                    position: { ...selectedElement.position, y: Number(e.target.value) }
                  })}
                  className="bg-gray-700 border-gray-600 text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="scale-x" className="text-xs text-gray-400">Escala X</Label>
                <Input
                  id="scale-x"
                  type="number"
                  step="0.1"
                  value={selectedElement.scale.x}
                  onChange={(e) => onUpdateElement(selectedElement.id, { 
                    scale: { ...selectedElement.scale, x: Number(e.target.value) }
                  })}
                  className="bg-gray-700 border-gray-600 text-white text-xs"
                />
              </div>
              <div>
                <Label htmlFor="scale-y" className="text-xs text-gray-400">Escala Y</Label>
                <Input
                  id="scale-y"
                  type="number"
                  step="0.1"
                  value={selectedElement.scale.y}
                  onChange={(e) => onUpdateElement(selectedElement.id, { 
                    scale: { ...selectedElement.scale, y: Number(e.target.value) }
                  })}
                  className="bg-gray-700 border-gray-600 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rotation" className="text-xs text-gray-400">
                Rotação: {Math.round(selectedElement.rotation.z)}°
              </Label>
              <Slider
                id="rotation"
                min={-180}
                max={180}
                value={[selectedElement.rotation.z]}
                onValueChange={(value) => onUpdateElement(selectedElement.id, { 
                  rotation: { ...selectedElement.rotation, z: value[0] }
                })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="opacity" className="text-xs text-gray-400">
                Opacidade: {Math.round(selectedElement.opacity * 100)}%
              </Label>
              <Slider
                id="opacity"
                min={0}
                max={1}
                step={0.01}
                value={[selectedElement.opacity]}
                onValueChange={(value) => onUpdateElement(selectedElement.id, { opacity: value[0] })}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Type-specific properties */}
        {selectedElement.type === 'text' && (
          <div className="property-group">
            <Label className="text-sm font-semibold text-gray-300">Texto</Label>
            <div className="space-y-3 mt-2">
              <div>
                <Label htmlFor="text-content" className="text-xs text-gray-400">Conteúdo</Label>
                <Input
                  id="text-content"
                  value={selectedElement.data.content || ''}
                  onChange={(e) => onUpdateElement(selectedElement.id, { 
                    data: { ...selectedElement.data, content: e.target.value }
                  })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="text-color" className="text-xs text-gray-400">Cor</Label>
                <Input
                  id="text-color"
                  type="color"
                  value={selectedElement.data.formatting?.color || '#333333'}
                  onChange={(e) => onUpdateElement(selectedElement.id, { 
                    data: { 
                      ...selectedElement.data, 
                      formatting: { 
                        ...selectedElement.data.formatting, 
                        color: e.target.value 
                      }
                    }
                  })}
                  className="bg-gray-700 border-gray-600 h-8"
                />
              </div>

              <div>
                <Label htmlFor="font-size" className="text-xs text-gray-400">
                  Tamanho: {selectedElement.data.formatting?.fontSize || 18}px
                </Label>
                <Slider
                  id="font-size"
                  min={8}
                  max={72}
                  value={[selectedElement.data.formatting?.fontSize || 18]}
                  onValueChange={(value) => onUpdateElement(selectedElement.id, { 
                    data: { 
                      ...selectedElement.data, 
                      formatting: { 
                        ...selectedElement.data.formatting, 
                        fontSize: value[0] 
                      }
                    }
                  })}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="properties-panel h-full bg-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Propriedades</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-gray-700 mx-4 mt-4">
          <TabsTrigger value="scene" className="text-xs">Cena</TabsTrigger>
          <TabsTrigger value="element" className="text-xs">Elemento</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="scene" className="mt-0">
            {renderSceneProperties()}
          </TabsContent>

          <TabsContent value="element" className="mt-0">
            {renderElementProperties()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}