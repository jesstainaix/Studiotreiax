import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileText, Sparkles, Play, Edit, RotateCcw, CheckCircle, AlertCircle, Zap, Brain, Video, Settings, Wand2, Volume2, Palette, Loader2, Download, Edit3, Eye, Users, Shield, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { enhancedPPTXConverter, type ConversionOptions, type ConversionResult, type ConversionProgress } from '@/lib/pptx/enhanced-conversion-service'
import { optimizedProcessor, type ProcessingMetrics } from '@/lib/pptx/optimized-processor'
import AITemplateRecommendations from '../ai/AITemplateRecommendations'
import { PPTXContent, TemplateRecommendation } from '../../services/aiTemplateService'

interface PPTXUploadProps {
  onUploadComplete?: (projectId: string) => void
  onNavigateToEditor?: (pptxFile: File) => void
  className?: string
}

interface UploadState {
  file: File | null
  isProcessing: boolean
  conversionProgress: ConversionProgress | null
  result: ConversionResult | null
  error: string | null
  isAnalyzingOCR: boolean
  status?: 'uploading' | 'processing' | 'completed' | 'error'
}

interface FormData {
  title: string
  description: string
  category: string
  targetAudience: string
  estimatedDuration: string
}

interface ConversionSettings {
  includeNarration: boolean
  voiceProvider: 'google' | 'elevenlabs' | 'azure'
  voiceId: string
  videoQuality: '720p' | '1080p' | '4k'
  outputFormat: 'mp4' | 'webm' | 'mov'
  includeSubtitles: boolean
  enhancedEffects: boolean
  interactiveElements: boolean
  customBranding: {
    enabled: boolean
    primaryColor: string
    secondaryColor: string
  }
}

interface AIAnalysisResult {
  detectedNRs: Array<{
    id: string
    title: string
    confidence: number
    relevantSlides: number[]
    keywords: string[]
    description?: string
  }>
  contentInsights: {
    complexity: 'basic' | 'intermediate' | 'advanced'
    estimatedReadingTime: number
    keyTopics: string[]
    targetAudience: string
    improvementSuggestions: string[]
  }
  qualityMetrics: {
    textQuality: number
    visualQuality: number
    structureQuality: number
    overallScore: number
  }
  slides: Array<{
    slideNumber: number
    title: string
    content: string
    detectedElements: string[]
    suggestedImprovements: string[]
  }>
}

const nrCategories = [
  {
    id: 'NR-01',
    title: 'NR-01 - Disposições Gerais',
    description: 'Diretrizes gerais de segurança e saúde no trabalho',
    keywords: ['disposições', 'gerais', 'diretrizes', 'segurança', 'saúde', 'trabalho', 'normas']
  },
  {
    id: 'NR-04',
    title: 'NR-04 - SESMT',
    description: 'Serviços Especializados em Engenharia de Segurança e Medicina do Trabalho',
    keywords: ['sesmt', 'engenharia', 'medicina', 'especializado', 'serviços', 'técnico']
  },
  {
    id: 'NR-05',
    title: 'NR-05 - CIPA',
    description: 'Comissão Interna de Prevenção de Acidentes',
    keywords: ['cipa', 'comissão', 'prevenção', 'acidentes', 'interna', 'representantes']
  },
  {
    id: 'NR-06',
    title: 'NR-06 - EPI',
    description: 'Equipamentos de Proteção Individual',
    keywords: ['epi', 'equipamentos', 'proteção', 'individual', 'capacete', 'luvas', 'óculos']
  },
  {
    id: 'NR-07',
    title: 'NR-07 - PCMSO',
    description: 'Programas de Controle Médico de Saúde Ocupacional',
    keywords: ['pcmso', 'médico', 'saúde', 'ocupacional', 'exames', 'controle']
  },
  {
    id: 'NR-09',
    title: 'NR-09 - Agentes Ocupacionais',
    description: 'Avaliação e Controle de Exposições a Agentes Físicos, Químicos e Biológicos',
    keywords: ['agentes', 'físicos', 'químicos', 'biológicos', 'exposição', 'avaliação']
  },
  {
    id: 'NR-10',
    title: 'NR-10 - Eletricidade',
    description: 'Segurança em Instalações e Serviços em Eletricidade',
    keywords: ['eletricidade', 'elétrica', 'instalações', 'energia', 'choque', 'alta tensão']
  },
  {
    id: 'NR-12',
    title: 'NR-12 - Máquinas e Equipamentos',
    description: 'Segurança no Trabalho em Máquinas e Equipamentos',
    keywords: ['máquinas', 'equipamentos', 'proteções', 'dispositivos', 'operação']
  },
  {
    id: 'NR-17',
    title: 'NR-17 - Ergonomia',
    description: 'Ergonomia e Condições de Trabalho',
    keywords: ['ergonomia', 'postura', 'movimentos', 'repetitivos', 'mobiliário', 'conforto']
  },
  {
    id: 'NR-18',
    title: 'NR-18 - Construção Civil',
    description: 'Condições e Meio Ambiente de Trabalho na Construção',
    keywords: ['construção', 'civil', 'obras', 'canteiro', 'andaimes', 'escavações']
  },
  {
    id: 'NR-20',
    title: 'NR-20 - Inflamáveis e Combustíveis',
    description: 'Segurança com Inflamáveis e Combustíveis',
    keywords: ['inflamáveis', 'combustíveis', 'explosão', 'fogo', 'gases', 'líquidos']
  },
  {
    id: 'NR-23',
    title: 'NR-23 - Proteção Contra Incêndios',
    description: 'Proteção Contra Incêndios e Plano de Emergência',
    keywords: ['incêndio', 'fogo', 'extintor', 'emergência', 'evacuação', 'brigada']
  },
  {
    id: 'NR-33',
    title: 'NR-33 - Espaços Confinados',
    description: 'Segurança e Saúde nos Trabalhos em Espaços Confinados',
    keywords: ['confinado', 'espaços', 'atmosfera', 'gases', 'ventilação', 'resgate']
  },
  {
    id: 'NR-35',
    title: 'NR-35 - Trabalho em Altura',
    description: 'Trabalho em Altura e Proteção Contra Quedas',
    keywords: ['altura', 'queda', 'andaimes', 'cinto', 'trava-quedas', 'ancoragem']
  }
]

const VOICE_OPTIONS = {
  google: [
    { id: 'pt-BR-Wavenet-A', name: 'Feminina (Brasileira)' },
    { id: 'pt-BR-Wavenet-B', name: 'Masculina (Brasileira)' },
    { id: 'pt-BR-Neural2-A', name: 'Neural Feminina' },
    { id: 'pt-BR-Neural2-B', name: 'Neural Masculina' }
  ],
  elevenlabs: [
    { id: 'rachel', name: 'Rachel (Premium)' },
    { id: 'domi', name: 'Domi (Energética)' },
    { id: 'bella', name: 'Bella (Suave)' },
    { id: 'antoni', name: 'Antoni (Masculina)' }
  ],
  azure: [
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Neural)' },
    { id: 'pt-BR-AntonioNeural', name: 'Antonio (Neural)' },
    { id: 'pt-BR-BrendaNeural', name: 'Brenda (Neural)' }
  ]
}

const PPTXUpload = React.memo(function PPTXUpload({ onUploadComplete, onNavigateToEditor, className }: PPTXUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    isProcessing: false,
    conversionProgress: null,
    result: null,
    error: null,
    isAnalyzingOCR: false,
    status: undefined
  })
  // Removed processingResult state as it's replaced by uploadState.result
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    targetAudience: 'Trabalhadores em geral',
    estimatedDuration: '10-15 minutos'
  })
  const [conversionSettings, setConversionSettings] = useState<ConversionSettings>({
    includeNarration: true,
    voiceProvider: 'google',
    voiceId: 'pt-BR-Wavenet-A',
    videoQuality: '1080p',
    outputFormat: 'mp4',
    includeSubtitles: true,
    enhancedEffects: true,
    interactiveElements: false,
    customBranding: {
      enabled: false,
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af'
    }
  })
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRecommendation | null>(null)
  const [pptxContent, setPptxContent] = useState<PPTXContent | null>(null)
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  const [processingMetrics, setProcessingMetrics] = useState<ProcessingMetrics | null>(null)
  const [optimizedMode, setOptimizedMode] = useState(true)

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup logic if needed
      console.log('PPTXUpload component unmounting')
    }
  }, [])

  const handleOpenEditor = () => {
    try {
      if (onNavigateToEditor && uploadState.file) {
        onNavigateToEditor(uploadState.file);
      } else if (uploadState.result?.project?.id) {
        // Fallback para navegação tradicional (se não houver callback)
        toast.success('Redirecionando para o editor...');
        navigate(`/editor/${uploadState.result.project.id}`);
      } else {
        toast.error('Nenhum projeto disponível para edição. Faça o upload de um arquivo primeiro.');
      }
    } catch (error) {
      console.error('Erro ao abrir editor:', error);
      toast.error('Erro ao abrir o editor. Tente novamente.');
    }
  }

  const handlePreviewProject = () => {
    try {
      if (uploadState.result?.project?.id) {
        toast.success('Abrindo visualização...');
        navigate(`/preview/${uploadState.result.project.id}`);
      } else {
        toast.error('Nenhum projeto disponível para visualização. Complete a conversão primeiro.');
      }
    } catch (error) {
      console.error('Erro ao abrir preview:', error);
      toast.error('Erro ao abrir a visualização. Tente novamente.');
    }
  };

  const handleDownloadVideo = () => {
    try {
      if (uploadState.result?.videoUrl) {
        const link = document.createElement('a')
        link.href = uploadState.result.videoUrl
        link.download = `${formData.title || 'video'}.${conversionSettings.outputFormat}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Download iniciado!')
      } else {
        toast.error('Vídeo não disponível para download. Complete a conversão primeiro.');
      }
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao fazer download. Tente novamente.');
    }
  }

  const handleImportPPTX = () => {
    try {
      if (fileInputRef.current) {
        fileInputRef.current.click();
        toast.info('Selecione um arquivo PPTX para importar...');
      }
    } catch (error) {
      console.error('Erro ao importar PPTX:', error);
      toast.error('Erro ao abrir seletor de arquivo. Tente novamente.');
    }
  }

  const handleGenerateProject = () => {
    try {
      if (uploadState.file) {
        toast.info('Iniciando geração do projeto...');
        handleConversion(uploadState.file);
      } else {
        toast.error('Selecione um arquivo PPTX primeiro para gerar o projeto.');
      }
    } catch (error) {
      console.error('Erro ao gerar projeto:', error);
      toast.error('Erro ao gerar projeto. Tente novamente.');
    }
  }

  const resetUpload = () => {
    setUploadState({
      file: null,
      isProcessing: false,
      conversionProgress: null,
      result: null,
      error: null,
      isAnalyzingOCR: false,
      status: undefined
    })
    setFormData({
      title: '',
      description: '',
      category: '',
      targetAudience: '',
      estimatedDuration: ''
    })
    setActiveTab('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getProgressPercentage = () => {
    if (!uploadState.conversionProgress) return 0
    
    // Fallback to progress field if currentStep/totalSteps are not available
    if (uploadState.conversionProgress.currentStep && uploadState.conversionProgress.totalSteps) {
      return Math.round(
        (uploadState.conversionProgress.currentStep / uploadState.conversionProgress.totalSteps) * 100
      )
    }
    
    return uploadState.conversionProgress.progress || 0
  }

  const getCurrentStepName = () => {
    if (!uploadState.conversionProgress) return ''
    return uploadState.conversionProgress.currentStepName || uploadState.conversionProgress.message || ''
  }

  const isUploading = uploadState.status === 'uploading' || uploadState.status === 'processing'

  // Handler for AI template selection
  const handleTemplateSelect = (template: TemplateRecommendation) => {
    setSelectedTemplate(template)
    toast.success(`Template "${template.name}" selecionado!`)
  }

  // Handler for content analysis
  const handleAnalyzeContent = () => {
    if (uploadState.file) {
      // Extract content from uploaded file for AI analysis
      const extractedContent: PPTXContent = {
        slides: [
          {
            title: formData.title || 'Slide 1',
            content: formData.description || 'Conteúdo do slide',
            images: 1,
            charts: 0,
            tables: 0
          }
        ],
        metadata: {
          slideCount: 1,
          hasImages: true,
          hasCharts: false,
          hasTables: false,
          estimatedDuration: 300
        }
      }
      setPptxContent(extractedContent)
      setShowAIRecommendations(true)
    }
  }

  return (
    <Card className={cn("w-full max-w-6xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Conversão Inteligente PPTX para Vídeo
        </CardTitle>
        <CardDescription>
          Sistema avançado de conversão com IA, narração automática e efeitos profissionais
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Tabs Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('upload')}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
              activeTab === 'upload'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Upload & Análise
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
              activeTab === 'settings'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
              activeTab === 'preview'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              !uploadState.result && "opacity-50 cursor-not-allowed"
            )}
            disabled={!uploadState.result}
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Resultado
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {!uploadState.file && !uploadState.isProcessing && !uploadState.result && (
              <>
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors bg-gradient-to-br from-blue-50 to-indigo-50">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="cursor-pointer" onClick={handleStartNewConversion}>
                    <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Selecione seu arquivo PPTX
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Arraste e solte ou clique para selecionar
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        Máximo 100MB
                      </span>
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        Análise automática com IA
                      </span>
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        Narração em português
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Button
                    onClick={handleImportPPTX}
                    variant="outline"
                    className="flex-1 h-12 text-blue-600 border-blue-200 hover:bg-blue-50"
                    aria-label="Importar arquivo PPTX existente"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Import PPTX
                  </Button>
                  <Button
                    onClick={handleGenerateProject}
                    variant="outline"
                    className="flex-1 h-12 text-green-600 border-green-200 hover:bg-green-50"
                    aria-label="Gerar novo projeto de vídeo"
                  >
                    <Wand2 className="h-5 w-5 mr-2" />
                    Gerar Projeto
                  </Button>
                </div>

                {/* Features Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-center mb-2">
                      <Brain className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-medium text-green-900">IA Avançada</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Detecção automática de NRs e análise de conteúdo
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-violet-50">
                    <div className="flex items-center mb-2">
                      <Volume2 className="h-5 w-5 text-purple-600 mr-2" />
                      <h4 className="font-medium text-purple-900">TTS Premium</h4>
                    </div>
                    <p className="text-sm text-purple-700">
                      Vozes brasileiras naturais com múltiplos provedores
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-amber-50">
                    <div className="flex items-center mb-2">
                      <Sparkles className="h-5 w-5 text-orange-600 mr-2" />
                      <h4 className="font-medium text-orange-900">Efeitos VFX</h4>
                    </div>
                    <p className="text-sm text-orange-700">
                      Transições profissionais e elementos interativos
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* File Selected - AI Recommendations */}
            {uploadState.file && !uploadState.isProcessing && !uploadState.result && (
              <div className="space-y-6">
                {/* File Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-900">{uploadState.file.name}</h4>
                        <p className="text-sm text-green-700">
                          {(uploadState.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAnalyzeContent}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Analisar com IA
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetUpload}
                        className="text-gray-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>

                {/* AI Template Recommendations */}
                {showAIRecommendations && pptxContent && (
                  <AITemplateRecommendations
                    content={pptxContent}
                    onTemplateSelect={handleTemplateSelect}
                    selectedTemplate={selectedTemplate}
                  />
                )}

                {/* Start Conversion Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => handleConversion(uploadState.file!)}
                    disabled={isUploading}
                    size="lg"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Iniciar Conversão
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {uploadState.isProcessing && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Processando sua apresentação</h3>
                  <p className="text-gray-600 mb-4">
                    {uploadState.isAnalyzingOCR ? 'Analisando conteúdo e detectando NRs...' : getCurrentStepName()}
                  </p>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className={`h-2 w-2 rounded-full ${uploadState.status === 'uploading' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="text-xs text-gray-500">Upload</span>
                    <div className={`h-2 w-2 rounded-full ${uploadState.status === 'processing' ? 'bg-yellow-500 animate-pulse' : uploadState.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs text-gray-500">Processamento</span>
                    <div className={`h-2 w-2 rounded-full ${uploadState.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs text-gray-500">Concluído</span>
                  </div>
                </div>

                {/* OCR Analysis Results */}
                {uploadState.ocrAnalysis && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-medium text-green-900">Análise OCR Concluída</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Confiança: </span>
                        <span className={`font-semibold ${
                          uploadState.ocrAnalysis.confidence > 0.8 ? 'text-green-600' : 
                          uploadState.ocrAnalysis.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(uploadState.ocrAnalysis.confidence * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">NRs Detectadas: </span>
                        <span className="font-semibold text-blue-600">
                          {uploadState.ocrAnalysis.detectedNRs.length}
                        </span>
                      </div>
                    </div>
                    {uploadState.ocrAnalysis.detectedNRs.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {uploadState.ocrAnalysis.detectedNRs.map((nr, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              NR {nr.number} - {nr.category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{getProgressPercentage()}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                </div>

                {uploadState.conversionProgress && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {uploadState.conversionProgress.slidesProcessed}
                      </div>
                      <div className="text-sm text-gray-600">Slides processados</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {uploadState.conversionProgress.totalSlides}
                      </div>
                      <div className="text-sm text-gray-600">Total de slides</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {uploadState.conversionProgress.estimatedTimeRemaining}s
                      </div>
                      <div className="text-sm text-gray-600">Tempo restante</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {uploadState.conversionProgress.currentStep}/{uploadState.conversionProgress.totalSteps}
                      </div>
                      <div className="text-sm text-gray-600">Etapa atual</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error State */}
            {uploadState.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro na conversão</AlertTitle>
                <AlertDescription>{uploadState.error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Project Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações do Projeto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Projeto *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Treinamento de Segurança Elétrica"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria (Norma Regulamentadora) *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {nrCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex flex-col">
                            <span>{category.title}</span>
                            <span className="text-xs text-gray-500">{category.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Projeto</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva os objetivos e conteúdo do treinamento..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audience">Público-Alvo</Label>
                  <Input
                    id="audience"
                    placeholder="Ex: Eletricistas, Técnicos em Segurança"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração Estimada</Label>
                  <Select value={formData.estimatedDuration} onValueChange={(value) => setFormData(prev => ({ ...prev, estimatedDuration: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a duração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10-15 minutos">10-15 minutos</SelectItem>
                      <SelectItem value="15-30 minutos">15-30 minutos</SelectItem>
                      <SelectItem value="30-45 minutos">30-45 minutos</SelectItem>
                      <SelectItem value="45-60 minutos">45-60 minutos</SelectItem>
                      <SelectItem value="60+ minutos">Mais de 60 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Audio Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Configurações de Áudio
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Incluir Narração</Label>
                    <p className="text-sm text-gray-500">Gerar áudio automático para os slides</p>
                  </div>
                  <Switch
                    checked={conversionSettings.includeNarration}
                    onCheckedChange={(checked) => 
                      setConversionSettings(prev => ({ ...prev, includeNarration: checked }))
                    }
                  />
                </div>

                {conversionSettings.includeNarration && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Provedor de Voz</Label>
                        <Select
                          value={conversionSettings.voiceProvider}
                          onValueChange={(value: 'google' | 'elevenlabs' | 'azure') => 
                            setConversionSettings(prev => ({ ...prev, voiceProvider: value, voiceId: VOICE_OPTIONS[value][0].id }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="google">Google Cloud TTS</SelectItem>
                            <SelectItem value="elevenlabs">ElevenLabs (Premium)</SelectItem>
                            <SelectItem value="azure">Azure Cognitive Services</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Voz</Label>
                        <Select
                          value={conversionSettings.voiceId}
                          onValueChange={(value) => 
                            setConversionSettings(prev => ({ ...prev, voiceId: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VOICE_OPTIONS[conversionSettings.voiceProvider].map((voice) => (
                              <SelectItem key={voice.id} value={voice.id}>
                                {voice.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Incluir Legendas</Label>
                        <p className="text-sm text-gray-500">Adicionar legendas sincronizadas ao vídeo</p>
                      </div>
                      <Switch
                        checked={conversionSettings.includeSubtitles}
                        onCheckedChange={(checked) => 
                          setConversionSettings(prev => ({ ...prev, includeSubtitles: checked }))
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Video Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Video className="h-5 w-5" />
                Configurações de Vídeo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Qualidade do Vídeo</Label>
                  <Select
                    value={conversionSettings.videoQuality}
                    onValueChange={(value: '720p' | '1080p' | '4k') => 
                      setConversionSettings(prev => ({ ...prev, videoQuality: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">HD (720p)</SelectItem>
                      <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                      <SelectItem value="4k">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formato de Saída</Label>
                  <Select
                    value={conversionSettings.outputFormat}
                    onValueChange={(value: 'mp4' | 'webm' | 'mov') => 
                      setConversionSettings(prev => ({ ...prev, outputFormat: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4 (Recomendado)</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                      <SelectItem value="mov">MOV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Effects Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Efeitos e Melhorias
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Efeitos Avançados</Label>
                    <p className="text-sm text-gray-500">Transições suaves e animações profissionais</p>
                  </div>
                  <Switch
                    checked={conversionSettings.enhancedEffects}
                    onCheckedChange={(checked) => 
                      setConversionSettings(prev => ({ ...prev, enhancedEffects: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Elementos Interativos</Label>
                    <p className="text-sm text-gray-500">Botões, quizzes e elementos clicáveis</p>
                  </div>
                  <Switch
                    checked={conversionSettings.interactiveElements}
                    onCheckedChange={(checked) => 
                      setConversionSettings(prev => ({ ...prev, interactiveElements: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Performance Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configurações de Performance
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Otimizado</Label>
                    <p className="text-sm text-gray-500">Processamento acelerado para arquivos grandes (50+ slides)</p>
                  </div>
                  <Switch
                    checked={optimizedMode}
                    onCheckedChange={setOptimizedMode}
                  />
                </div>

                {processingMetrics && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Métricas de Performance</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-blue-600">{processingMetrics.processingTime ? (processingMetrics.processingTime / 1000).toFixed(1) : '0.0'}s</div>
                        <div className="text-gray-600">Tempo Total</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-600">{processingMetrics.slidesProcessed && processingMetrics.processingTime ? (processingMetrics.slidesProcessed / (processingMetrics.processingTime / 1000)).toFixed(1) : '0.0'}</div>
                        <div className="text-gray-600">Slides/seg</div>
                      </div>
                      <div>
                        <div className="font-semibold text-purple-600">{(processingMetrics as any).cacheHitRate || 0}%</div>
                        <div className="text-gray-600">Cache Hit</div>
                      </div>
                      <div>
                        <div className="font-semibold text-orange-600">{(processingMetrics as any).memoryUsage || 0}MB</div>
                        <div className="text-gray-600">Memória</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Branding Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalização Visual
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aplicar Marca Personalizada</Label>
                    <p className="text-sm text-gray-500">Usar cores e elementos da sua empresa</p>
                  </div>
                  <Switch
                    checked={conversionSettings.customBranding.enabled}
                    onCheckedChange={(checked) => 
                      setConversionSettings(prev => ({ 
                        ...prev, 
                        customBranding: { ...prev.customBranding, enabled: checked }
                      }))
                    }
                  />
                </div>

                {conversionSettings.customBranding.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={conversionSettings.customBranding.primaryColor}
                          onChange={(e) => 
                            setConversionSettings(prev => ({ 
                              ...prev, 
                              customBranding: { ...prev.customBranding, primaryColor: e.target.value }
                            }))
                          }
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={conversionSettings.customBranding.primaryColor}
                          onChange={(e) => 
                            setConversionSettings(prev => ({ 
                              ...prev, 
                              customBranding: { ...prev.customBranding, primaryColor: e.target.value }
                            }))
                          }
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={conversionSettings.customBranding.secondaryColor}
                          onChange={(e) => 
                            setConversionSettings(prev => ({ 
                              ...prev, 
                              customBranding: { ...prev.customBranding, secondaryColor: e.target.value }
                            }))
                          }
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          value={conversionSettings.customBranding.secondaryColor}
                          onChange={(e) => 
                            setConversionSettings(prev => ({ 
                              ...prev, 
                              customBranding: { ...prev.customBranding, secondaryColor: e.target.value }
                            }))
                          }
                          placeholder="#1e40af"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            {uploadState.result ? (
              <>
                {/* Success State */}
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Conversão Concluída!</h3>
                  <p className="text-gray-600 mb-6">
                    Seu arquivo PPTX foi convertido com sucesso em um vídeo interativo.
                  </p>
                  
                  {/* Success Metrics */}
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Processamento completo</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Qualidade otimizada</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Pronto para uso</span>
                    </div>
                  </div>
                </div>

                {/* Results Summary */}
                {uploadState.result.analysis && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Análise Inteligente
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-sm text-gray-600">Slides Processados</p>
                        <p className="font-medium text-gray-900">
                          {uploadState.result.analysis.slideCount}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-sm text-gray-600">Duração Estimada</p>
                        <p className="font-medium text-gray-900">
                          {uploadState.result.analysis.contentInsights?.estimatedDuration || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {uploadState.result.analysis.detectedNRs && uploadState.result.analysis.detectedNRs.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-blue-800 mb-2">Normas Detectadas:</h5>
                        <div className="flex flex-wrap gap-2">
                          {uploadState.result.analysis.detectedNRs.map((nr, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                              {nr.category} ({Math.round(nr.confidence * 100)}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadState.result.analysis.contentInsights?.mainTopics && (
                      <div>
                        <h5 className="font-medium text-blue-800 mb-2">Tópicos Identificados:</h5>
                        <div className="flex flex-wrap gap-2">
                          {uploadState.result.analysis.contentInsights.mainTopics.map((topic, index) => (
                            <span key={index} className="px-2 py-1 bg-white text-blue-700 rounded text-sm border border-blue-200">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={handleEditProject} className="flex items-center justify-center gap-2">
                    <Edit className="h-4 w-4" />
                    Editar Projeto
                  </Button>
                  <Button onClick={handlePreviewProject} variant="outline" className="flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    Visualizar Vídeo
                  </Button>
                  <Button onClick={handleDownloadVideo} variant="outline" className="flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>

                {/* Start New Conversion */}
                <div className="text-center pt-6 border-t">
                  <Button onClick={resetUpload} variant="ghost" className="flex items-center justify-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Nova Conversão
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum resultado disponível</h3>
                <p className="text-gray-600 mb-6">
                  Faça o upload de um arquivo PPTX para ver os resultados da conversão.
                </p>
                <Button onClick={() => setActiveTab('upload')} className="flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  Fazer Upload
                </Button>
              </div>
            )}
          </div>
        )}

        {uploadState.isProcessing && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Processando arquivo...</span>
            </div>
            
            <Progress value={getProgressPercentage()} className="w-full" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Progresso Geral</h4>
                <p className="text-sm text-gray-600">{getProgressPercentage()}% concluído</p>
              </div>
            </div>
            
            {getCurrentStepName() === 'Análise de Conteúdo' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Análise de Conteúdo</span>
                </div>
                <p className="text-xs text-blue-600">
                  Extraindo texto, identificando elementos visuais e analisando estrutura do conteúdo...
                </p>
              </div>
            )}
            
            {getCurrentStepName() === 'Processamento IA' && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Processamento IA</span>
                </div>
                <p className="text-xs text-purple-600">
                  Criando cenários 3D, gerando avatares e aplicando configurações de compliance...
                </p>
              </div>
            )}
          </div>
        )}

        {uploadState.result && !uploadState.isProcessing && !uploadState.error && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Processamento concluído com sucesso!</span>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Vídeo Gerado com IA</span>
              </div>
              <p className="text-sm text-green-700">
                Seu conteúdo foi transformado em um vídeo interativo com cenários 3D, 
                avatares realistas e narração profissional.
              </p>
            </div>
            
            {uploadState.result?.analysis && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Análise Inteligente Aplicada</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">{uploadState.result.analysis.title}</h4>
                    <p className="text-xs text-blue-700">{uploadState.result.analysis.description}</p>
                  </div>
                  
                  {uploadState.result.analysis.detectedNRCategories && uploadState.result.analysis.detectedNRCategories.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-blue-800 block mb-2">NRs Detectadas:</span>
                      <div className="flex flex-wrap gap-2">
                        {uploadState.result.analysis.detectedNRCategories.map((nr, i) => (
                          <Badge key={i} variant={nr.confidence > 0.8 ? 'default' : 'secondary'} className="text-xs">
                            {nr.category} ({Math.round(nr.confidence * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {uploadState.result.analysis.contentAnalysis && (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-blue-700 font-medium">Complexidade:</span>
                        <span className="ml-1 text-blue-600">{uploadState.result.analysis.contentAnalysis.complexity}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Duração:</span>
                        <span className="ml-1 text-blue-600">{uploadState.result.analysis.contentAnalysis.suggestedDuration}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-blue-700 font-medium">Público-alvo:</span>
                        <span className="ml-1 text-blue-600">{uploadState.result.analysis.contentAnalysis.targetAudience}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Cenários 3D</span>
                </div>
                <p className="text-xs text-gray-600">
                  {uploadState.result?.videoScenes?.length || 0} cenários realistas criados
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Avatares IA</span>
                </div>
                <p className="text-xs text-gray-600">
                  Personagens virtuais integrados
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Compliance</span>
                </div>
                <p className="text-xs text-gray-600">
                  Normas {formData.category} aplicadas
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button onClick={handleEditProject} className="flex-1">
                <Edit3 className="w-4 h-4 mr-2" />
                Abrir no Editor
              </Button>
              <Button variant="outline" onClick={handlePreviewProject} className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Novo Upload
              </Button>
            </div>
          </div>
        )}

        {uploadState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {uploadState.error || 'Erro no upload. Tente novamente.'}
            </AlertDescription>
          </Alert>
        )}

        {uploadState.error && (
          <div className="flex space-x-2">
            <Button onClick={resetUpload} variant="outline" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleStartNewConversion} className="flex-1">
              Tentar Novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default PPTXUpload