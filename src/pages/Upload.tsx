import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Loading } from '../components/ui/loading'
import { toast } from 'sonner'
import { 
  Upload as UploadIcon, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  FileImage,
  Play
} from 'lucide-react'

interface UploadedFile {
  file: File
  id: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  analysisId?: string
  slides?: Array<{
    id: string
    title: string
    content: string
    thumbnail?: string
  }>
}

export default function Upload() {
  const navigate = useNavigate()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading' as const,
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Simular upload para cada arquivo
    newFiles.forEach(uploadFile => {
      simulateUpload(uploadFile)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  })

  const simulateUpload = async (uploadFile: UploadedFile) => {
    try {
      // Simular progresso de upload
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress }
              : f
          )
        )
      }

      // Marcar como processando
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'processing', progress: 100 }
            : f
        )
      )

      // Simular análise IA
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Simular slides extraídos
      const mockSlides = [
        {
          id: '1',
          title: 'Introdução à Segurança no Trabalho',
          content: 'Conceitos básicos de segurança e prevenção de acidentes'
        },
        {
          id: '2', 
          title: 'Equipamentos de Proteção Individual',
          content: 'Tipos de EPIs e sua importância na prevenção'
        },
        {
          id: '3',
          title: 'Procedimentos de Emergência',
          content: 'Como agir em situações de risco e emergência'
        }
      ]

      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'completed', 
                analysisId: 'analysis_' + Math.random().toString(36).substr(2, 9),
                slides: mockSlides
              }
            : f
        )
      )

      toast.success('Arquivo processado com sucesso!')
    } catch (error) {
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', error: 'Erro ao processar arquivo' }
            : f
        )
      )
      toast.error('Erro ao processar arquivo')
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const createProject = async (file: UploadedFile) => {
    if (!file.analysisId) return

    setIsProcessing(true)
    try {
      // Simular criação de projeto
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const projectId = 'project_' + Math.random().toString(36).substr(2, 9)
      toast.success('Projeto criado com sucesso!')
      navigate(`/editor/${projectId}`)
    } catch (error) {
      toast.error('Erro ao criar projeto')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loading size="sm" />
      case 'processing':
        return <Loading size="sm" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-danger-500" />
    }
  }

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Enviando...'
      case 'processing':
        return 'Analisando conteúdo...'
      case 'completed':
        return 'Pronto para edição'
      case 'error':
        return 'Erro no processamento'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Upload de Apresentações
          </h1>
          <p className="text-gray-600 font-body">
            Faça upload de seus arquivos PowerPoint para criar vídeos interativos com IA
          </p>
        </div>

        {/* Área de Upload */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="w-5 h-5" />
              Selecionar Arquivos
            </CardTitle>
            <CardDescription>
              Arraste e solte seus arquivos PPTX aqui ou clique para selecionar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDragActive ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <FileText className={`w-8 h-8 ${
                    isDragActive ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <p className="text-lg font-body font-medium text-gray-900 mb-1">
                    {isDragActive
                      ? 'Solte os arquivos aqui'
                      : 'Arraste arquivos PPTX aqui'
                    }
                  </p>
                  <p className="text-sm text-gray-500 font-body">
                    ou <span className="text-primary-600 font-medium">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-body">
                    Suporta arquivos .pptx e .ppt até 50MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Arquivos */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Enviados</CardTitle>
              <CardDescription>
                Acompanhe o progresso do processamento dos seus arquivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FileImage className="w-8 h-8 text-primary-600" />
                        <div>
                          <h3 className="font-body font-medium text-gray-900">
                            {file.file.name}
                          </h3>
                          <p className="text-sm text-gray-500 font-body">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        <span className="text-sm font-body text-gray-600">
                          {getStatusText(file.status)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <div className="mb-3">
                        <Progress value={file.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1 font-body">
                          {file.progress}% concluído
                        </p>
                      </div>
                    )}

                    {/* Erro */}
                    {file.status === 'error' && file.error && (
                      <div className="bg-danger-50 border border-danger-200 rounded-md p-3 mb-3">
                        <p className="text-sm text-danger-700 font-body">{file.error}</p>
                      </div>
                    )}

                    {/* Slides Extraídos */}
                    {file.status === 'completed' && file.slides && (
                      <div className="space-y-3">
                        <h4 className="font-body font-medium text-gray-900">
                          Slides Identificados ({file.slides.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {file.slides.map((slide) => (
                            <div key={slide.id} className="border rounded-md p-3 bg-gray-50">
                              <h5 className="font-body font-medium text-sm text-gray-900 mb-1">
                                {slide.title}
                              </h5>
                              <p className="text-xs text-gray-600 font-body line-clamp-2">
                                {slide.content}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end pt-3">
                          <Button
                            onClick={() => createProject(file)}
                            disabled={isProcessing}
                            className="flex items-center gap-2"
                          >
                            {isProcessing ? (
                              <Loading size="sm" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            {isProcessing ? 'Criando Projeto...' : 'Criar Projeto'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}