import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Save, 
  Download, 
  Eye,
  Edit,
  Volume2,
  Settings,
  Image,
  Type,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import type { PPTXDocument, SlideData } from '../../lib/pptx/enhanced-slide-extractor'

interface SimpleVideoProject {
  id: string
  title: string
  slides: VideoSlide[]
  totalDuration: number
  settings: {
    resolution: string
    format: string
    quality: number
  }
}

interface VideoSlide {
  id: string
  slideNumber: number
  title: string
  content: string
  duration: number
  background: string
  thumbnail: string
  voiceNarration: {
    enabled: boolean
    text: string
    voice: string
    speed: number
  }
  transitions: {
    in: string
    out: string
  }
}

interface SimpleVideoEditorProps {
  pptxDocument?: PPTXDocument
  onSave?: (project: SimpleVideoProject) => void
  onExport?: (project: SimpleVideoProject) => void
  className?: string
}

export default function SimpleVideoEditor({ 
  pptxDocument, 
  onSave, 
  onExport, 
  className 
}: SimpleVideoEditorProps) {
  const [project, setProject] = useState<SimpleVideoProject | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeTab, setActiveTab] = useState('slides')

  // Initialize project from PPTX
  useEffect(() => {
    if (pptxDocument && !project) {
      try {
        const slides: VideoSlide[] = pptxDocument.slides.map((slide, index) => ({
          id: `slide-${index + 1}`,
          slideNumber: index + 1,
          title: slide.title || `Slide ${index + 1}`,
          content: slide.content || '',
          duration: 5, // Default 5 seconds per slide
          background: slide.background || '#ffffff',
          thumbnail: slide.thumbnail || '',
          voiceNarration: {
            enabled: false,
            text: slide.content || '',
            voice: 'pt-BR-Wavenet-A',
            speed: 1.0
          },
          transitions: {
            in: 'fade',
            out: 'fade'
          }
        }))

        const newProject: SimpleVideoProject = {
          id: `project-${Date.now()}`,
          title: pptxDocument.title || 'Novo Projeto de Vídeo',
          slides,
          totalDuration: slides.length * 5,
          settings: {
            resolution: '1920x1080',
            format: 'mp4',
            quality: 85
          }
        }

        setProject(newProject)
        toast.success('Projeto criado a partir do PowerPoint!')
      } catch (error) {
        console.error('Erro ao criar projeto:', error)
        toast.error('Erro ao criar projeto a partir do PowerPoint')
      }
    }
  }, [pptxDocument, project])

  const handlePlay = useCallback(() => {
    setIsPlaying(!isPlaying)
    toast.info(isPlaying ? 'Reprodução pausada' : 'Reprodução iniciada')
  }, [isPlaying])

  const handleNextSlide = useCallback(() => {
    if (project && currentSlideIndex < project.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }, [project, currentSlideIndex])

  const handlePrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }, [currentSlideIndex])

  const handleSave = useCallback(() => {
    if (project && onSave) {
      onSave(project)
      toast.success('Projeto salvo com sucesso!')
    }
  }, [project, onSave])

  const handleExport = useCallback(() => {
    if (project && onExport) {
      onExport(project)
      toast.success('Exportação iniciada!')
    }
  }, [project, onExport])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum projeto carregado
          </h3>
          <p className="text-sm text-gray-500">
            Carregue um arquivo PowerPoint para começar
          </p>
        </div>
      </div>
    )
  }

  const currentSlide = project.slides[currentSlideIndex]

  return (
    <div className={`simple-video-editor bg-gray-900 text-white min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{project.title}</h1>
            <p className="text-sm text-gray-400">
              Slide {currentSlideIndex + 1} de {project.slides.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={handleExport} variant="default" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Preview Area */}
        <div className="flex-1 p-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-0">
              {/* Video Preview */}
              <div className="aspect-video bg-black rounded-t-lg relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {currentSlide ? (
                    <div className="text-center p-8">
                      <h2 className="text-2xl font-bold mb-4">{currentSlide.title}</h2>
                      <p className="text-lg">{currentSlide.content}</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">Preview do Slide</div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 bg-gray-700">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Button onClick={handlePrevSlide} variant="ghost" size="sm">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button onClick={handlePlay} variant="ghost" size="lg">
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button onClick={handleNextSlide} variant="ghost" size="sm">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">00:00</span>
                  <div className="flex-1 bg-gray-600 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                  <span className="text-sm text-gray-400">
                    {Math.floor(project.totalDuration / 60)}:{(project.totalDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="slides">Slides</TabsTrigger>
              <TabsTrigger value="edit">Editar</TabsTrigger>
              <TabsTrigger value="settings">Config</TabsTrigger>
            </TabsList>

            <TabsContent value="slides" className="space-y-4">
              <div className="space-y-2">
                {project.slides.map((slide, index) => (
                  <Card 
                    key={slide.id}
                    className={`bg-gray-700 border-gray-600 cursor-pointer transition-all ${
                      index === currentSlideIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-600 rounded flex items-center justify-center">
                          <span className="text-xs">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{slide.title}</h4>
                          <p className="text-xs text-gray-400">{slide.duration}s</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              {currentSlide && (
                <div className="space-y-4">
                  <div>
                    <Label>Título do Slide</Label>
                    <Input 
                      value={currentSlide.title}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label>Duração (segundos)</Label>
                    <Input 
                      type="number"
                      value={currentSlide.duration}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label>Narração de Voz</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={currentSlide.voiceNarration.enabled} />
                        <span className="text-sm">Ativar narração</span>
                      </div>
                      <Input 
                        placeholder="Texto da narração..."
                        value={currentSlide.voiceNarration.text}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Resolução</Label>
                  <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded">
                    <option value="1920x1080">1920x1080 (Full HD)</option>
                    <option value="1280x720">1280x720 (HD)</option>
                    <option value="3840x2160">3840x2160 (4K)</option>
                  </select>
                </div>
                <div>
                  <Label>Formato</Label>
                  <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded">
                    <option value="mp4">MP4</option>
                    <option value="avi">AVI</option>
                    <option value="mov">MOV</option>
                  </select>
                </div>
                <div>
                  <Label>Qualidade: {project.settings.quality}%</Label>
                  <Slider 
                    value={[project.settings.quality]} 
                    max={100} 
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}