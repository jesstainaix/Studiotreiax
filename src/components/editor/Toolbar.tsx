import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Type, 
  Image, 
  Video, 
  Mic, 
  Shapes, 
  Download, 
  Save, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Grid3X3, 
  Layers,
  Settings,
  Upload,
  FileText,
  Palette
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  zoom: number
  showGrid: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSeek: (time: number) => void
  onAddLayer: (type: 'text' | 'image' | 'video' | 'audio' | 'shape') => void
  onSave: () => void
  onExport: () => void
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onToggleGrid: () => void
  onUploadPPTX: () => void
}

export default function Toolbar({
  isPlaying,
  currentTime,
  duration,
  zoom,
  showGrid,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onAddLayer,
  onSave,
  onExport,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onToggleGrid,
  onUploadPPTX
}: ToolbarProps) {
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gray-900 border-b border-gray-700 p-3">
      <div className="flex items-center justify-between">
        {/* Seção de Arquivo */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onUploadPPTX}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar PPTX
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Separator orientation="vertical" className="h-6 bg-gray-600" />
        </div>

        {/* Seção de Edição */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Undo className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Redo className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 bg-gray-600" />
        </div>

        {/* Controles de Reprodução */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSeek(Math.min(duration, currentTime + 10))}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          
          {/* Indicador de tempo */}
          <div className="text-sm text-gray-400 font-mono min-w-[80px] text-center">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          <Separator orientation="vertical" className="h-6 bg-gray-600" />
        </div>

        {/* Ferramentas de Adição */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddLayer('text')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Adicionar Texto"
          >
            <Type className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddLayer('image')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Adicionar Imagem"
          >
            <Image className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddLayer('video')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Adicionar Vídeo/Slide"
          >
            <Video className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddLayer('audio')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Adicionar Áudio"
          >
            <Mic className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddLayer('shape')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Adicionar Forma"
          >
            <Shapes className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 bg-gray-600" />
        </div>

        {/* Controles de Visualização */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-gray-400 font-mono min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleGrid}
            className={cn(
              "text-gray-300 hover:text-white hover:bg-gray-700",
              showGrid && "text-blue-400 bg-blue-900/20"
            )}
            title="Alternar Grade"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Barra de progresso */}
      <div className="mt-3">
        <div className="relative">
          <div className="w-full h-1 bg-gray-700 rounded-full">
            <div 
              className="h-1 bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          
          {/* Marcadores de tempo */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0:00</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}