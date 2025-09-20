import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Type, 
  Image, 
  Video, 
  Mic, 
  Palette, 
  Move, 
  RotateCw, 
  Layers,
  Volume2,
  Eye,
  Lock
} from 'lucide-react'

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

interface PropertiesPanelProps {
  layer: Layer
  onUpdate: (updates: Partial<Layer>) => void
}

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS'
]

const textAlignments = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
  { value: 'justify', label: 'Justificado' }
]

const fontWeights = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Negrito' },
  { value: '300', label: 'Leve' },
  { value: '600', label: 'Semi-negrito' },
  { value: '800', label: 'Extra-negrito' }
]

export default function PropertiesPanel({ layer, onUpdate }: PropertiesPanelProps) {
  const [localProperties, setLocalProperties] = useState(layer.properties || {})

  // Atualizar propriedade local e global
  const updateProperty = (key: string, value: any) => {
    const newProperties = { ...localProperties, [key]: value }
    setLocalProperties(newProperties)
    onUpdate({ properties: newProperties })
  }

  // Atualizar propriedade da camada
  const updateLayerProperty = (key: string, value: any) => {
    onUpdate({ [key]: value })
  }

  // Renderizar controles para texto
  const renderTextControls = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="text">Texto</Label>
        <Textarea
          id="text"
          value={localProperties.text || ''}
          onChange={(e) => updateProperty('text', e.target.value)}
          placeholder="Digite o texto..."
          className="mt-1"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="fontSize">Tamanho</Label>
          <Input
            id="fontSize"
            type="number"
            value={localProperties.fontSize || 16}
            onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
            min="8"
            max="200"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="color">Cor</Label>
          <div className="flex mt-1">
            <Input
              id="color"
              type="color"
              value={localProperties.color || '#ffffff'}
              onChange={(e) => updateProperty('color', e.target.value)}
              className="w-12 h-10 p-1 border rounded-l"
            />
            <Input
              value={localProperties.color || '#ffffff'}
              onChange={(e) => updateProperty('color', e.target.value)}
              className="flex-1 rounded-l-none"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="fontFamily">Fonte</Label>
        <Select value={localProperties.fontFamily || 'Arial'} onValueChange={(value) => updateProperty('fontFamily', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map(font => (
              <SelectItem key={font} value={font}>{font}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="fontWeight">Peso</Label>
          <Select value={localProperties.fontWeight || 'normal'} onValueChange={(value) => updateProperty('fontWeight', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontWeights.map(weight => (
                <SelectItem key={weight.value} value={weight.value}>{weight.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="textAlign">Alinhamento</Label>
          <Select value={localProperties.textAlign || 'left'} onValueChange={(value) => updateProperty('textAlign', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {textAlignments.map(align => (
                <SelectItem key={align.value} value={align.value}>{align.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="textShadow">Sombra do Texto</Label>
        <div className="flex items-center space-x-2 mt-1">
          <input
            type="checkbox"
            checked={localProperties.textShadow !== 'none'}
            onChange={(e) => updateProperty('textShadow', e.target.checked ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none')}
            className="rounded"
          />
          <span className="text-sm text-gray-400">Ativar sombra</span>
        </div>
      </div>
    </div>
  )

  // Renderizar controles para imagem
  const renderImageControls = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="src">URL da Imagem</Label>
        <Input
          id="src"
          value={localProperties.src || ''}
          onChange={(e) => updateProperty('src', e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="opacity">Opacidade</Label>
        <div className="mt-2">
          <Slider
            value={[localProperties.opacity || 100]}
            onValueChange={([value]) => updateProperty('opacity', value)}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>{localProperties.opacity || 100}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="borderRadius">Borda Arredondada</Label>
        <div className="mt-2">
          <Slider
            value={[localProperties.borderRadius || 0]}
            onValueChange={([value]) => updateProperty('borderRadius', value)}
            max={50}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0px</span>
            <span>{localProperties.borderRadius || 0}px</span>
            <span>50px</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Renderizar controles para áudio
  const renderAudioControls = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="audioSrc">Arquivo de Áudio</Label>
        <Input
          id="audioSrc"
          value={localProperties.src || ''}
          onChange={(e) => updateProperty('src', e.target.value)}
          placeholder="URL do arquivo de áudio"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="volume">Volume</Label>
        <div className="mt-2">
          <Slider
            value={[localProperties.volume || 80]}
            onValueChange={([value]) => updateProperty('volume', value)}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>{localProperties.volume || 80}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="fadeIn">Fade In (segundos)</Label>
        <Input
          id="fadeIn"
          type="number"
          value={localProperties.fadeIn || 0}
          onChange={(e) => updateProperty('fadeIn', parseFloat(e.target.value))}
          min="0"
          max="5"
          step="0.1"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="fadeOut">Fade Out (segundos)</Label>
        <Input
          id="fadeOut"
          type="number"
          value={localProperties.fadeOut || 0}
          onChange={(e) => updateProperty('fadeOut', parseFloat(e.target.value))}
          min="0"
          max="5"
          step="0.1"
          className="mt-1"
        />
      </div>
    </div>
  )

  // Renderizar controles para vídeo
  const renderVideoControls = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="videoSrc">Fonte do Vídeo/Slide</Label>
        <Input
          id="videoSrc"
          value={localProperties.src || ''}
          onChange={(e) => updateProperty('src', e.target.value)}
          placeholder="URL da imagem ou vídeo"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="objectFit">Ajuste</Label>
        <Select value={localProperties.objectFit || 'cover'} onValueChange={(value) => updateProperty('objectFit', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cobrir</SelectItem>
            <SelectItem value="contain">Conter</SelectItem>
            <SelectItem value="fill">Preencher</SelectItem>
            <SelectItem value="scale-down">Reduzir</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  // Ícone por tipo de camada
  const getLayerIcon = () => {
    switch (layer.type) {
      case 'text': return <Type className="w-4 h-4" />
      case 'image': return <Image className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'audio': return <Mic className="w-4 h-4" />
      default: return <Layers className="w-4 h-4" />
    }
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Header da camada */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            {getLayerIcon()}
            <span>{layer.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="layerName">Nome da Camada</Label>
            <Input
              id="layerName"
              value={layer.name}
              onChange={(e) => updateLayerProperty('name', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={(e) => updateLayerProperty('visible', e.target.checked)}
                className="rounded"
              />
              <Eye className="w-4 h-4" />
              <span className="text-sm">Visível</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={layer.locked}
                onChange={(e) => updateLayerProperty('locked', e.target.checked)}
                className="rounded"
              />
              <Lock className="w-4 h-4" />
              <span className="text-sm">Bloqueado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Timing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startTime">Início (s)</Label>
              <Input
                id="startTime"
                type="number"
                value={layer.startTime}
                onChange={(e) => updateLayerProperty('startTime', parseFloat(e.target.value))}
                min="0"
                step="0.1"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duração (s)</Label>
              <Input
                id="duration"
                type="number"
                value={layer.duration}
                onChange={(e) => updateLayerProperty('duration', parseFloat(e.target.value))}
                min="0.1"
                step="0.1"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posição e Tamanho */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Move className="w-4 h-4" />
            <span>Posição & Tamanho</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x">X</Label>
              <Input
                id="x"
                type="number"
                value={localProperties.x || 0}
                onChange={(e) => updateProperty('x', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="y">Y</Label>
              <Input
                id="y"
                type="number"
                value={localProperties.y || 0}
                onChange={(e) => updateProperty('y', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          
          {(layer.type === 'image' || layer.type === 'video') && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="width">Largura</Label>
                <Input
                  id="width"
                  type="number"
                  value={localProperties.width || 200}
                  onChange={(e) => updateProperty('width', parseInt(e.target.value))}
                  min="10"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="height">Altura</Label>
                <Input
                  id="height"
                  type="number"
                  value={localProperties.height || 150}
                  onChange={(e) => updateProperty('height', parseInt(e.target.value))}
                  min="10"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="zIndex">Camada Z</Label>
            <Input
              id="zIndex"
              type="number"
              value={localProperties.zIndex || 1}
              onChange={(e) => updateProperty('zIndex', parseInt(e.target.value))}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Propriedades específicas por tipo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Palette className="w-4 h-4" />
            <span>Propriedades</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {layer.type === 'text' && renderTextControls()}
          {layer.type === 'image' && renderImageControls()}
          {layer.type === 'audio' && renderAudioControls()}
          {layer.type === 'video' && renderVideoControls()}
        </CardContent>
      </Card>
    </div>
  )
}