import React from 'react'
import { Button } from '../../ui/button'
import { 
  User, 
  Image, 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Music, 
  Video, 
  Mic,
  Camera,
  Palette,
  Sparkles,
  Layers,
  Settings
} from 'lucide-react'

interface ToolsPanelProps {
  onAddAvatar: () => void
  onAddBackground: () => void
  onAddText: () => void
  onAddShape: () => void
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  onAddAvatar,
  onAddBackground,
  onAddText,
  onAddShape
}) => {
  const avatarTypes = [
    { id: 'instructor-male', name: 'Instrutor Masculino' },
    { id: 'instructor-female', name: 'Instrutora Feminina' },
    { id: 'safety-male', name: 'Técnico de Segurança' },
    { id: 'safety-female', name: 'Técnica de Segurança' },
    { id: 'engineer-male', name: 'Engenheiro' },
    { id: 'engineer-female', name: 'Engenheira' }
  ]

  const backgroundTypes = [
    { id: 'office', name: 'Escritório' },
    { id: 'factory', name: 'Fábrica' },
    { id: 'construction', name: 'Canteiro de Obras' },
    { id: 'laboratory', name: 'Laboratório' },
    { id: 'warehouse', name: 'Armazém' },
    { id: 'training-room', name: 'Sala de Treinamento' }
  ]

  const textStyles = [
    { id: 'title', name: 'Título Principal' },
    { id: 'subtitle', name: 'Subtítulo' },
    { id: 'body', name: 'Texto Corpo' },
    { id: 'caption', name: 'Legenda' },
    { id: 'highlight', name: 'Destaque' }
  ]

  const shapeTypes = [
    { id: 'rectangle', name: 'Retângulo', icon: Square },
    { id: 'circle', name: 'Círculo', icon: Circle },
    { id: 'triangle', name: 'Triângulo', icon: Triangle },
    { id: 'arrow', name: 'Seta', icon: Triangle },
    { id: 'star', name: 'Estrela', icon: Sparkles }
  ]

  return (
    <div className="tools-panel space-y-6">
      {/* Avatares 3D */}
      <div className="tool-section">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
          <User className="w-4 h-4 mr-2" />
          Avatares 3D
        </h3>
        <div className="space-y-2">
          {avatarTypes.map(avatar => (
            <Button
              key={avatar.id}
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
              onClick={onAddAvatar}
            >
              <User className="w-3 h-3 mr-2" />
              {avatar.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Fundos e Cenários */}
      <div className="tool-section">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
          <Image className="w-4 h-4 mr-2" />
          Fundos e Cenários
        </h3>
        <div className="space-y-2">
          {backgroundTypes.map(bg => (
            <Button
              key={bg.id}
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
              onClick={onAddBackground}
            >
              <Camera className="w-3 h-3 mr-2" />
              {bg.name}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
            onClick={onAddBackground}
          >
            <Video className="w-3 h-3 mr-2" />
            Vídeo de Fundo
          </Button>
        </div>
      </div>

      {/* Texto */}
      <div className="tool-section">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
          <Type className="w-4 h-4 mr-2" />
          Elementos de Texto
        </h3>
        <div className="space-y-2">
          {textStyles.map(style => (
            <Button
              key={style.id}
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
              onClick={onAddText}
            >
              <Type className="w-3 h-3 mr-2" />
              {style.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Formas */}
      <div className="tool-section">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
          <Layers className="w-4 h-4 mr-2" />
          Formas e Elementos
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {shapeTypes.map(shape => {
            const IconComponent = shape.icon
            return (
              <Button
                key={shape.id}
                variant="outline"
                size="sm"
                className="text-xs text-white border-gray-600 hover:bg-gray-700"
                onClick={onAddShape}
              >
                <IconComponent className="w-3 h-3 mr-1" />
                {shape.name}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Áudio */}
      <div className="tool-section">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
          <Music className="w-4 h-4 mr-2" />
          Áudio
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
          >
            <Mic className="w-3 h-3 mr-2" />
            Gravação de Voz
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
          >
            <Music className="w-3 h-3 mr-2" />
            Música de Fundo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
          >
            <Settings className="w-3 h-3 mr-2" />
            Efeitos Sonoros
          </Button>
        </div>
      </div>

      {/* Configurações Rápidas */}
      <div className="tool-section">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Configurações
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
          >
            <Palette className="w-3 h-3 mr-2" />
            Cores do Tema
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
          >
            <Type className="w-3 h-3 mr-2" />
            Fontes
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs text-white border-gray-600 hover:bg-gray-700"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            Animações
          </Button>
        </div>
      </div>
    </div>
  )
}