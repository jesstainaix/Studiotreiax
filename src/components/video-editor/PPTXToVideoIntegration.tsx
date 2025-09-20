import React, { useState, useCallback } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { ArrowRight, Film, FileText, Eye, Edit, Download } from 'lucide-react'
import { toast } from 'sonner'
import { enhancedSlideExtractor, type PPTXDocument } from '../../lib/pptx/enhanced-slide-extractor'
import { pipelineApiService, type PipelineJob } from '../../services/pipelineApiService'
import SimpleVideoEditor from './SimpleVideoEditor'

interface VideoProject {
  id: string
  title: string
  description: string
  totalDuration: number
  settings: {
    resolution: string
    format: string
    quality: number
  }
}

interface PPTXToVideoIntegrationProps {
  pptxFile?: File
  onBack?: () => void
  className?: string
}

export default function PPTXToVideoIntegration({ 
  pptxFile, 
  onBack, 
  className 
}: PPTXToVideoIntegrationProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'editor' | 'preview'>('upload')
  const [pptxDocument, setPptxDocument] = useState<PPTXDocument | null>(null)
  const [videoProject, setVideoProject] = useState<VideoProject | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pipelineJob, setPipelineJob] = useState<PipelineJob | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('')

  // Process PPTX file using real backend pipeline
  const processPPTXFile = useCallback(async (file: File) => {
    try {
      setIsProcessing(true)
      setError(null)
      setProgress(0)
      setCurrentStep('analysis')
      
      // Extrair slides do PPTX
      setCurrentStage('Extraindo slides...')
      const document = await enhancedSlideExtractor.extractSlides(file)
      setPptxDocument(document)
      setProgress(30)
      
      // Criar job no pipeline
      setCurrentStage('Iniciando pipeline de conversão...')
      const job = await pipelineApiService.createJob({
        type: 'pptx-to-video',
        input: {
          slides: document.slides,
          metadata: document.metadata
        },
        settings: {
          resolution: '1920x1080',
          format: 'mp4',
          quality: 'high'
        }
      })
      
      setPipelineJob(job)
      setProgress(50)
      
      // Monitorar progresso do job
      setCurrentStage('Processando vídeo...')
      const finalJob = await pipelineApiService.monitorJob(job.id, (progress) => {
        setProgress(50 + (progress * 0.4)) // 50% a 90%
      })
      
      if (finalJob.status === 'completed' && finalJob.result) {
        // Criar projeto de vídeo
        const project: VideoProject = {
          id: `project-${Date.now()}`,
          title: document.metadata.title || 'Projeto PPTX',
          description: `Convertido de ${file.name}`,
          totalDuration: finalJob.result.duration || 0,
          settings: {
            resolution: '1920x1080',
            format: 'mp4',
            quality: 85
          }
        }
        
        setVideoProject(project)
        setProgress(100)
        setCurrentStep('editor')
        toast.success('PPTX convertido com sucesso!')
      } else {
        throw new Error('Falha na conversão do PPTX')
      }
      
    } catch (err) {
      console.error('Erro ao processar PPTX:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      toast.error('Erro ao processar PPTX')
    } finally {
      setIsProcessing(false)
    }
  }, [])
  
  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      processPPTXFile(file)
    } else {
      toast.error('Por favor, selecione um arquivo PPTX válido')
    }
  }, [processPPTXFile])
  
  // Initialize with provided file
  React.useEffect(() => {
    if (pptxFile && currentStep === 'upload') {
      processPPTXFile(pptxFile)
    }
  }, [pptxFile, processPPTXFile, currentStep])
  
  const renderUploadStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Converter PPTX para Vídeo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">Selecione um arquivo PPTX</p>
          <p className="text-gray-600 mb-4">Converta sua apresentação em um vídeo profissional</p>
          <input
            type="file"
            accept=".pptx"
            onChange={handleFileUpload}
            className="hidden"
            id="pptx-upload"
          />
          <label
            htmlFor="pptx-upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            Escolher Arquivo
          </label>
        </div>
      </CardContent>
    </Card>
  )
  
  const renderAnalysisStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          Processando PPTX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{currentStage}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {pptxDocument && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Informações do Documento</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Título: {pptxDocument.metadata.title}</div>
              <div>Slides: {pptxDocument.slides.length}</div>
              <div>Autor: {pptxDocument.metadata.author || 'N/A'}</div>
              <div>Criado: {pptxDocument.metadata.createdAt ? new Date(pptxDocument.metadata.createdAt).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
  
  const renderEditorStep = () => {
    if (!videoProject) return null
    
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Editor de Vídeo</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('preview')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
            >
              Voltar
            </Button>
          </div>
        </div>
        
        <SimpleVideoEditor
          project={videoProject}
          onSave={(updatedProject) => {
            setVideoProject(updatedProject)
            toast.success('Projeto salvo!')
          }}
        />
      </div>
    )
  }
  
  const renderPreviewStep = () => (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Preview do Vídeo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-white text-center">
            <Film className="h-12 w-12 mx-auto mb-2" />
            <p>Preview do vídeo será exibido aqui</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('editor')}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar
            </Button>
            <Button className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Finalizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
  
  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => {
                setError(null)
                setCurrentStep('upload')
              }}
            >
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className={className}>
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'analysis' && renderAnalysisStep()}
      {currentStep === 'editor' && renderEditorStep()}
      {currentStep === 'preview' && renderPreviewStep()}
    </div>
  )
}