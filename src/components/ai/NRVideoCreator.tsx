import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { 
  Sparkles, 
  Video, 
  Play, 
  Clock, 
  Users, 
  Target,
  Zap,
  Shield,
  HardHat,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader2,
  FileText,
  Download,
  Eye
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface NRVideoCreatorProps {
  className?: string
  onVideoCreated?: (videoData: any) => void
}

interface NRCategory {
  id: string
  nr: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  templates: number
  difficulty: 'Básico' | 'Intermediário' | 'Avançado'
  duration: string
}

interface VideoRequest {
  category: string
  description: string
  targetAudience: string
  duration: string
  complexity: string
  specificTopics: string[]
}

export default function NRVideoCreator({ className, onVideoCreated }: NRVideoCreatorProps) {
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)
  const [request, setRequest] = useState<VideoRequest>({
    category: '',
    description: '',
    targetAudience: 'funcionarios',
    duration: '10-15',
    complexity: 'basico',
    specificTopics: []
  })
  const [generatedVideo, setGeneratedVideo] = useState<any>(null)

  // Categorias de NR disponíveis
  const nrCategories: NRCategory[] = [
    {
      id: 'nr6',
      nr: 'NR-6',
      title: 'Equipamento de Proteção Individual',
      description: 'EPI - Uso, conservação e manutenção',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-blue-500',
      templates: 8,
      difficulty: 'Básico',
      duration: '10-15 min'
    },
    {
      id: 'nr10',
      nr: 'NR-10',
      title: 'Segurança em Instalações Elétricas',
      description: 'Prevenção de acidentes elétricos',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-yellow-500',
      templates: 12,
      difficulty: 'Avançado',
      duration: '20-30 min'
    },
    {
      id: 'nr18',
      nr: 'NR-18',
      title: 'Condições de Segurança na Construção',
      description: 'Segurança na construção civil',
      icon: <HardHat className="w-6 h-6" />,
      color: 'bg-orange-500',
      templates: 15,
      difficulty: 'Intermediário',
      duration: '15-20 min'
    },
    {
      id: 'nr35',
      nr: 'NR-35',
      title: 'Trabalho em Altura',
      description: 'Prevenção de quedas e acidentes',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'bg-red-500',
      templates: 10,
      difficulty: 'Avançado',
      duration: '25-30 min'
    },
    {
      id: 'nr5',
      nr: 'NR-5',
      title: 'Comissão Interna de Prevenção',
      description: 'CIPA - Organização e funcionamento',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-500',
      templates: 6,
      difficulty: 'Intermediário',
      duration: '15-20 min'
    },
    {
      id: 'nr33',
      nr: 'NR-33',
      title: 'Segurança em Espaços Confinados',
      description: 'Prevenção de acidentes em espaços confinados',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-purple-500',
      templates: 9,
      difficulty: 'Avançado',
      duration: '20-25 min'
    }
  ]

  // Processar criação do vídeo
  const handleCreateVideo = useCallback(async () => {
    if (!request.category || !request.description) {
      alert('Por favor, selecione uma categoria e descreva o conteúdo do vídeo.')
      return
    }

    setIsCreating(true)
    
    try {
      // Simular processamento de IA
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const selectedCategory = nrCategories.find(cat => cat.id === request.category)
      
      const videoData = {
        id: `video_${Date.now()}`,
        title: `Treinamento ${selectedCategory?.nr}: ${request.description.slice(0, 50)}...`,
        category: selectedCategory?.nr || '',
        description: request.description,
        duration: request.duration,
        targetAudience: request.targetAudience,
        complexity: request.complexity,
        status: 'ready',
        createdAt: new Date().toISOString(),
        thumbnailUrl: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20workplace%20safety%20training%20video%20thumbnail%20${selectedCategory?.nr}%20modern%20clean%20design&image_size=landscape_16_9`,
        videoUrl: '#', // URL seria gerada pelo backend
        downloadUrl: '#' // URL de download seria gerada pelo backend
      }
      
      setGeneratedVideo(videoData)
      onVideoCreated?.(videoData)
      
    } catch (error) {
      console.error('Erro ao criar vídeo:', error)
      alert('Erro ao criar vídeo. Tente novamente.')
    } finally {
      setIsCreating(false)
    }
  }, [request, nrCategories, onVideoCreated])

  // Resetar formulário
  const resetForm = () => {
    setRequest({
      category: '',
      description: '',
      targetAudience: 'funcionarios',
      duration: '10-15',
      complexity: 'basico',
      specificTopics: []
    })
    setGeneratedVideo(null)
  }

  // Navegar para o editor
  const openInEditor = () => {
    if (generatedVideo) {
      navigate(`/editor?video=${generatedVideo.id}&template=${request.category}`)
    }
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            ChatGPT para Vídeos NR
          </h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Descreva o que você precisa e nossa IA criará um vídeo de treinamento profissional em segundos
        </p>
      </div>

      {!generatedVideo ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-5 h-5 mr-2 text-blue-600" />
              Criar Novo Vídeo de Treinamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Categoria */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Categoria da Norma Regulamentadora *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {nrCategories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      'p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md',
                      request.category === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => setRequest(prev => ({ ...prev, category: category.id }))}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white', category.color)}>
                      {category.icon}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900">{category.nr}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{category.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {category.difficulty}
                      </Badge>
                      <span className="text-xs text-gray-500">{category.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descrição do Conteúdo */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Descreva o conteúdo do vídeo *
              </label>
              <Textarea
                placeholder="Ex: Quero um vídeo sobre o uso correto de capacetes de segurança, incluindo inspeção visual, ajuste adequado e situações onde é obrigatório o uso..."
                value={request.description}
                onChange={(e) => setRequest(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Configurações Avançadas */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Público-alvo
                </label>
                <Select value={request.targetAudience} onValueChange={(value) => setRequest(prev => ({ ...prev, targetAudience: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionarios">Funcionários</SelectItem>
                    <SelectItem value="supervisores">Supervisores</SelectItem>
                    <SelectItem value="gestores">Gestores</SelectItem>
                    <SelectItem value="cipeiros">Cipeiros</SelectItem>
                    <SelectItem value="tecnicos">Técnicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Duração
                </label>
                <Select value={request.duration} onValueChange={(value) => setRequest(prev => ({ ...prev, duration: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5-10">5-10 minutos</SelectItem>
                    <SelectItem value="10-15">10-15 minutos</SelectItem>
                    <SelectItem value="15-20">15-20 minutos</SelectItem>
                    <SelectItem value="20-30">20-30 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Complexidade
                </label>
                <Select value={request.complexity} onValueChange={(value) => setRequest(prev => ({ ...prev, complexity: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão de Criação */}
            <div className="flex justify-center pt-4">
              <Button 
                size="lg"
                onClick={handleCreateVideo}
                disabled={isCreating || !request.category || !request.description}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Criando Vídeo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Criar Vídeo com IA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Resultado do Vídeo Gerado */
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-2" />
              Vídeo Criado com Sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Preview do Vídeo */}
              <div className="space-y-4">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                  <img 
                    src={generatedVideo.thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Button size="lg" className="rounded-full w-16 h-16">
                      <Play className="w-8 h-8" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={openInEditor} className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Editar no Studio
                  </Button>
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Detalhes do Vídeo */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {generatedVideo.title}
                  </h3>
                  <p className="text-gray-600">
                    {generatedVideo.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Categoria:</span>
                    <Badge className="block w-fit">{generatedVideo.category}</Badge>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Duração:</span>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {generatedVideo.duration} minutos
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Público:</span>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      {generatedVideo.targetAudience}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge variant="default" className="bg-green-600">
                      Pronto
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex justify-center space-x-4 pt-4 border-t border-green-200">
              <Button onClick={resetForm} variant="outline">
                Criar Outro Vídeo
              </Button>
              <Button onClick={() => navigate('/projects')}>
                Ver Todos os Projetos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}