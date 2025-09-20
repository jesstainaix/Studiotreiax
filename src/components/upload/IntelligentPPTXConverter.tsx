import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  Download,
  Sparkles,
  Brain,
  Eye,
  Mic,
  Video,
  Users,
  Shield,
  Zap,
  Settings,
  Search,
  Target,
  Lightbulb,
  TrendingUp,
  Play,
  Edit3,
  Wand2,
  Layers,
  Palette,
  Volume2,
  Globe,
  Clock,
  BarChart3,
  Cpu,
  Database,
  Network
} from 'lucide-react'
import { toast } from 'sonner'

interface ConversionSettings {
  // Análise de Conteúdo
  contentAnalysis: {
    enableAIAnalysis: boolean
    detectNRs: boolean
    extractKeyPoints: boolean
    analyzeComplexity: boolean
    generateSummary: boolean
  }
  
  // Configurações de Vídeo
  videoSettings: {
    resolution: '720p' | '1080p' | '4K'
    frameRate: 24 | 30 | 60
    duration: 'auto' | 'custom'
    customDuration: number
    aspectRatio: '16:9' | '4:3' | '1:1'
  }
  
  // Avatar e Narração
  avatarSettings: {
    enableAvatar: boolean
    avatarStyle: 'professional' | 'casual' | 'technical'
    voiceGender: 'male' | 'female' | 'neutral'
    voiceSpeed: number
    voiceLanguage: 'pt-BR' | 'en-US' | 'es-ES'
  }
  
  // Efeitos Visuais
  visualEffects: {
    enableTransitions: boolean
    transitionStyle: 'fade' | 'slide' | 'zoom' | 'custom'
    enableAnimations: boolean
    backgroundStyle: 'corporate' | 'modern' | 'minimal' | 'custom'
    colorScheme: 'auto' | 'corporate' | 'safety' | 'custom'
  }
  
  // Configurações Avançadas
  advanced: {
    enableSubtitles: boolean
    enableChapters: boolean
    enableInteractivity: boolean
    optimizeForMobile: boolean
    enableAnalytics: boolean
  }
}

interface ProcessingStage {
  id: string
  name: string
  description: string
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  details?: string
}

interface IntelligentAnalysis {
  contentStructure: {
    totalSlides: number
    textDensity: 'low' | 'medium' | 'high'
    imageCount: number
    chartCount: number
    complexity: 'basic' | 'intermediate' | 'advanced'
  }
  
  nrDetection: {
    detectedNRs: Array<{
      id: string
      title: string
      confidence: number
      reasons: string[]
      compliance: string
    }>
    riskLevel: 'low' | 'medium' | 'high'
    safetyScore: number
  }
  
  contentOptimization: {
    suggestedTitle: string
    keyTopics: string[]
    targetAudience: string
    estimatedDuration: string
    learningObjectives: string[]
    improvementSuggestions: string[]
  }
  
  technicalAnalysis: {
    fileSize: number
    processingTime: number
    qualityScore: number
    compatibilityIssues: string[]
    optimizationOpportunities: string[]
  }
}

const IntelligentPPTXConverter: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [analysis, setAnalysis] = useState<IntelligentAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState('upload')
  
  const [settings, setSettings] = useState<ConversionSettings>({
    contentAnalysis: {
      enableAIAnalysis: true,
      detectNRs: true,
      extractKeyPoints: true,
      analyzeComplexity: true,
      generateSummary: true
    },
    videoSettings: {
      resolution: '1080p',
      frameRate: 30,
      duration: 'auto',
      customDuration: 300,
      aspectRatio: '16:9'
    },
    avatarSettings: {
      enableAvatar: true,
      avatarStyle: 'professional',
      voiceGender: 'female',
      voiceSpeed: 1.0,
      voiceLanguage: 'pt-BR'
    },
    visualEffects: {
      enableTransitions: true,
      transitionStyle: 'fade',
      enableAnimations: true,
      backgroundStyle: 'corporate',
      colorScheme: 'auto'
    },
    advanced: {
      enableSubtitles: true,
      enableChapters: true,
      enableInteractivity: false,
      optimizeForMobile: true,
      enableAnalytics: true
    }
  })
  
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([
    {
      id: 'upload',
      name: 'Upload do Arquivo',
      description: 'Carregando arquivo PowerPoint',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'extraction',
      name: 'Extração de Conteúdo',
      description: 'Extraindo texto, imagens e estrutura',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'analysis',
      name: 'Análise Inteligente',
      description: 'Analisando conteúdo com IA avançada',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'optimization',
      name: 'Otimização de Conteúdo',
      description: 'Otimizando estrutura e fluxo',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'generation',
      name: 'Geração de Vídeo',
      description: 'Criando vídeo com avatares e efeitos',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'finalization',
      name: 'Finalização',
      description: 'Aplicando configurações finais',
      progress: 0,
      status: 'pending'
    }
  ])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validar tipo de arquivo
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint'
      ]
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pptx') && !selectedFile.name.endsWith('.ppt')) {
        toast.error('Por favor, selecione um arquivo PowerPoint (.pptx ou .ppt)')
        return
      }

      // Validar tamanho (100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 100MB')
        return
      }

      setFile(selectedFile)
      setActiveTab('settings')
      toast.success('Arquivo carregado com sucesso!')
    }
  }, [])

  const simulateIntelligentAnalysis = useCallback(async (file: File): Promise<IntelligentAnalysis> => {
    // Simular análise inteligente
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      contentStructure: {
        totalSlides: Math.floor(Math.random() * 20) + 10,
        textDensity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        imageCount: Math.floor(Math.random() * 15) + 5,
        chartCount: Math.floor(Math.random() * 8) + 2,
        complexity: ['basic', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)] as any
      },
      nrDetection: {
        detectedNRs: [
          {
            id: 'NR-10',
            title: 'NR-10 - Segurança em Instalações Elétricas',
            confidence: 0.92,
            reasons: ['Menção a equipamentos elétricos', 'Procedimentos de segurança'],
            compliance: 'Parcialmente conforme'
          },
          {
            id: 'NR-06',
            title: 'NR-06 - Equipamentos de Proteção Individual',
            confidence: 0.85,
            reasons: ['Imagens de EPIs', 'Procedimentos de uso'],
            compliance: 'Conforme'
          }
        ],
        riskLevel: 'medium',
        safetyScore: 87
      },
      contentOptimization: {
        suggestedTitle: 'Treinamento de Segurança Elétrica - NR-10',
        keyTopics: ['Segurança Elétrica', 'Procedimentos', 'EPIs', 'Riscos'],
        targetAudience: 'Eletricistas e Técnicos',
        estimatedDuration: '12-15 minutos',
        learningObjectives: [
          'Identificar riscos elétricos',
          'Aplicar procedimentos de segurança',
          'Utilizar EPIs adequados'
        ],
        improvementSuggestions: [
          'Adicionar mais exemplos práticos',
          'Incluir casos reais de acidentes',
          'Melhorar qualidade das imagens'
        ]
      },
      technicalAnalysis: {
        fileSize: file.size,
        processingTime: 0,
        qualityScore: 78,
        compatibilityIssues: [],
        optimizationOpportunities: [
          'Compressão de imagens',
          'Otimização de texto',
          'Melhoria de layout'
        ]
      }
    }
  }, [])

  const processFile = useCallback(async () => {
    if (!file) return
    
    setIsProcessing(true)
    setCurrentStage(0)
    setActiveTab('processing')
    
    try {
      // Simular processamento por etapas
      for (let i = 0; i < processingStages.length; i++) {
        setCurrentStage(i)
        
        // Atualizar status da etapa atual
        setProcessingStages(prev => prev.map((stage, index) => {
          if (index === i) {
            return { ...stage, status: 'processing' }
          }
          return stage
        }))
        
        // Simular progresso da etapa
        for (let progress = 0; progress <= 100; progress += 10) {
          setProcessingStages(prev => prev.map((stage, index) => {
            if (index === i) {
              return { ...stage, progress }
            }
            return stage
          }))
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        // Marcar etapa como concluída
        setProcessingStages(prev => prev.map((stage, index) => {
          if (index === i) {
            return { ...stage, status: 'completed', progress: 100 }
          }
          return stage
        }))
        
        // Executar análise inteligente na etapa correspondente
        if (i === 2) { // Etapa de análise
          const analysisResult = await simulateIntelligentAnalysis(file)
          setAnalysis(analysisResult)
        }
      }
      
      setActiveTab('results')
      toast.success('Conversão concluída com sucesso!')
      
    } catch (error) {
      toast.error('Erro durante o processamento')
      console.error('Processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [file, processingStages.length, simulateIntelligentAnalysis])

  const updateSettings = useCallback((section: keyof ConversionSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }, [])

  const resetConverter = () => {
    setFile(null)
    setIsProcessing(false)
    setCurrentStage(0)
    setAnalysis(null)
    setActiveTab('upload')
    setProcessingStages(prev => prev.map(stage => ({
      ...stage,
      progress: 0,
      status: 'pending'
    })))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Conversor PPTX Inteligente
        </h1>
        <p className="text-lg text-gray-600">
          Transforme apresentações em vídeos de treinamento com IA avançada
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" disabled={isProcessing}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="settings" disabled={!file || isProcessing}>
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="processing" disabled={!file}>
            <Cpu className="h-4 w-4 mr-2" />
            Processamento
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!analysis}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Resultados
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Upload de Arquivo
              </CardTitle>
              <CardDescription>
                Selecione um arquivo PowerPoint para conversão inteligente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx,.ppt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!file ? (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Selecione seu arquivo PowerPoint
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Suporte para .pptx e .ppt até 100MB
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Escolher Arquivo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{file.name}</h3>
                      <p className="text-gray-600">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <div className="flex gap-2 justify-center mt-4">
                        <Button variant="outline" onClick={resetConverter}>
                          <X className="h-4 w-4 mr-2" />
                          Remover
                        </Button>
                        <Button onClick={() => setActiveTab('settings')}>
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Análise de Conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Análise de Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Análise com IA</Label>
                  <Checkbox
                    checked={settings.contentAnalysis.enableAIAnalysis}
                    onCheckedChange={(checked) => 
                      updateSettings('contentAnalysis', 'enableAIAnalysis', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Detectar Normas Regulamentadoras</Label>
                  <Checkbox
                    checked={settings.contentAnalysis.detectNRs}
                    onCheckedChange={(checked) => 
                      updateSettings('contentAnalysis', 'detectNRs', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Extrair Pontos-Chave</Label>
                  <Checkbox
                    checked={settings.contentAnalysis.extractKeyPoints}
                    onCheckedChange={(checked) => 
                      updateSettings('contentAnalysis', 'extractKeyPoints', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Analisar Complexidade</Label>
                  <Checkbox
                    checked={settings.contentAnalysis.analyzeComplexity}
                    onCheckedChange={(checked) => 
                      updateSettings('contentAnalysis', 'analyzeComplexity', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Vídeo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-600" />
                  Configurações de Vídeo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Resolução</Label>
                  <Select
                    value={settings.videoSettings.resolution}
                    onValueChange={(value) => 
                      updateSettings('videoSettings', 'resolution', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">HD (720p)</SelectItem>
                      <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                      <SelectItem value="4K">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Taxa de Quadros</Label>
                  <Select
                    value={settings.videoSettings.frameRate.toString()}
                    onValueChange={(value) => 
                      updateSettings('videoSettings', 'frameRate', parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 fps (Cinema)</SelectItem>
                      <SelectItem value="30">30 fps (Padrão)</SelectItem>
                      <SelectItem value="60">60 fps (Suave)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Proporção</Label>
                  <Select
                    value={settings.videoSettings.aspectRatio}
                    onValueChange={(value) => 
                      updateSettings('videoSettings', 'aspectRatio', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                      <SelectItem value="4:3">4:3 (Tradicional)</SelectItem>
                      <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Avatar e Narração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Avatar e Narração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Habilitar Avatar</Label>
                  <Checkbox
                    checked={settings.avatarSettings.enableAvatar}
                    onCheckedChange={(checked) => 
                      updateSettings('avatarSettings', 'enableAvatar', checked)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Estilo do Avatar</Label>
                  <Select
                    value={settings.avatarSettings.avatarStyle}
                    onValueChange={(value) => 
                      updateSettings('avatarSettings', 'avatarStyle', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Velocidade da Voz</Label>
                  <Slider
                    value={[settings.avatarSettings.voiceSpeed]}
                    onValueChange={([value]) => 
                      updateSettings('avatarSettings', 'voiceSpeed', value)
                    }
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 text-center">
                    {settings.avatarSettings.voiceSpeed}x
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Efeitos Visuais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-orange-600" />
                  Efeitos Visuais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Transições</Label>
                  <Checkbox
                    checked={settings.visualEffects.enableTransitions}
                    onCheckedChange={(checked) => 
                      updateSettings('visualEffects', 'enableTransitions', checked)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Estilo de Transição</Label>
                  <Select
                    value={settings.visualEffects.transitionStyle}
                    onValueChange={(value) => 
                      updateSettings('visualEffects', 'transitionStyle', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Esquema de Cores</Label>
                  <Select
                    value={settings.visualEffects.colorScheme}
                    onValueChange={(value) => 
                      updateSettings('visualEffects', 'colorScheme', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automático</SelectItem>
                      <SelectItem value="corporate">Corporativo</SelectItem>
                      <SelectItem value="safety">Segurança</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={processFile} 
              size="lg" 
              className="min-w-[200px]"
              disabled={!file}
            >
              <Wand2 className="h-5 w-5 mr-2" />
              Iniciar Conversão
            </Button>
          </div>
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-600" />
                Processamento Inteligente
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso da conversão em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {processingStages.map((stage, index) => (
                  <div key={stage.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          stage.status === 'completed' ? 'bg-green-100 text-green-600' :
                          stage.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                          stage.status === 'error' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {stage.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : stage.status === 'processing' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : stage.status === 'error' ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <div className="w-2 h-2 bg-current rounded-full" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{stage.name}</h4>
                          <p className="text-sm text-gray-600">{stage.description}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        {stage.progress}%
                      </div>
                    </div>
                    <Progress value={stage.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estrutura do Conteúdo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    Estrutura do Conteúdo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-600">Total de Slides</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {analysis.contentStructure.totalSlides}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-600">Imagens</p>
                      <p className="text-2xl font-bold text-green-900">
                        {analysis.contentStructure.imageCount}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-purple-600">Gráficos</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {analysis.contentStructure.chartCount}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm text-orange-600">Complexidade</p>
                      <p className="text-lg font-bold text-orange-900 capitalize">
                        {analysis.contentStructure.complexity}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detecção de NRs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Normas Detectadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Score de Segurança</span>
                    <Badge className={`${
                      analysis.nrDetection.safetyScore >= 80 ? 'bg-green-100 text-green-800' :
                      analysis.nrDetection.safetyScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {analysis.nrDetection.safetyScore}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {analysis.nrDetection.detectedNRs.map((nr, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{nr.title}</h4>
                          <Badge variant="secondary">
                            {Math.round(nr.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{nr.compliance}</p>
                        <div className="flex flex-wrap gap-1">
                          {nr.reasons.map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Otimização de Conteúdo */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Otimização de Conteúdo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Título Sugerido</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {analysis.contentOptimization.suggestedTitle}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Público-Alvo</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {analysis.contentOptimization.targetAudience}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Tópicos Principais</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.contentOptimization.keyTopics.map((topic, index) => (
                          <Badge key={index} variant="secondary">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Duração Estimada</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {analysis.contentOptimization.estimatedDuration}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Objetivos de Aprendizagem</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {analysis.contentOptimization.learningObjectives.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sugestões de Melhoria</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {analysis.contentOptimization.improvementSuggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={resetConverter}>
              <X className="h-4 w-4 mr-2" />
              Nova Conversão
            </Button>
            <Button onClick={() => navigate('/editor')}>
              <Edit3 className="h-4 w-4 mr-2" />
              Editar Projeto
            </Button>
            <Button onClick={() => navigate('/preview')}>
              <Play className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default IntelligentPPTXConverter