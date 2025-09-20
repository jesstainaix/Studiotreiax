import React, { useState, useCallback, useRef } from 'react'
import { Upload, FileText, Eye, Brain, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { GPT4VisionService, type PPTXAnalysisResult } from '@/services/gpt4-vision-service'
import { PPTXParserService } from '@/services/pptx-parser-service'

// Types are now imported from GPT4VisionService

interface UploadProgress {
  stage: 'uploading' | 'extracting' | 'analyzing' | 'generating' | 'completed'
  progress: number
  message: string
}

const EnhancedPPTXUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [analysis, setAnalysis] = useState<PPTXAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gpt4VisionService = useRef(new GPT4VisionService())
  const pptxParserService = useRef(new PPTXParserService())

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pptx')) {
      setError('Por favor, selecione um arquivo PPTX válido')
      return
    }

    setFile(selectedFile)
    setError(null)
    setAnalysis(null)
    setUploadProgress(null)

    // Start real GPT-4 Vision analysis
    analyzeWithGPT4Vision(selectedFile)
      .then(result => {
        setAnalysis(result)
        setUploadProgress(null)
      })
      .catch(err => {
        console.error('GPT-4 Vision analysis error:', err)
        setError(`Erro na análise: ${err.message}`)
        setUploadProgress(null)
      })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const analyzeWithGPT4Vision = async (file: File): Promise<PPTXAnalysisResult> => {
    // Validate PPTX file first
    setUploadProgress({ stage: 'uploading', progress: 5, message: 'Validando arquivo PPTX...' })
    
    const isValid = await PPTXParserService.validatePPTXFile(file)
    if (!isValid) {
      throw new Error('Arquivo PPTX inválido ou corrompido')
    }

    // Extract slide content
    setUploadProgress({ stage: 'extracting', progress: 20, message: 'Extraindo conteúdo dos slides...' })
    const slideContents = await pptxParserService.current.parsePPTXFile(file)
    
    if (slideContents.length === 0) {
      throw new Error('Nenhum slide encontrado no arquivo')
    }

    // Analyze with GPT-4 Vision
    setUploadProgress({ stage: 'analyzing', progress: 40, message: 'Iniciando análise com GPT-4 Vision...' })
    
    const progressCallback = (progress: number, message: string) => {
      const adjustedProgress = 40 + (progress * 0.6) // Scale progress from 40% to 100%
      setUploadProgress({ 
        stage: progress === 100 ? 'completed' : 'analyzing', 
        progress: adjustedProgress, 
        message 
      })
    }

    const result = await gpt4VisionService.current.analyzePPTXWithVision(
      slideContents,
      file.name,
      progressCallback
    )

    return result
  }

  const handleAnalyze = async () => {
    if (!file) return

    try {
      setError(null)
      const result = await simulateGPT4VisionAnalysis(file)
      setAnalysis(result)
    } catch (err) {
      setError('Erro ao analisar o arquivo. Tente novamente.')
      console.error('Analysis error:', err)
    } finally {
      setUploadProgress(null)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-2 border-dashed transition-colors duration-200 hover:border-blue-400">
        <CardContent className="p-8">
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed transition-all duration-200 p-8 text-center",
              isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400",
              file && "border-green-400 bg-green-50"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="flex flex-col items-center gap-4">
              {file ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAnalyze} disabled={!!uploadProgress}>
                      {uploadProgress ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Analisar com IA
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null)
                        setAnalysis(null)
                        setUploadProgress(null)
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Arraste seu arquivo PPTX aqui
                    </p>
                    <p className="text-sm text-gray-500">
                      ou clique para selecionar (máx. 50MB)
                    </p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Selecionar Arquivo
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Processando com GPT-4 Vision</h3>
                <Badge variant="outline">{uploadProgress.progress}%</Badge>
              </div>
              <Progress value={uploadProgress.progress} className="h-2" />
              <p className="text-sm text-gray-600">{uploadProgress.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Análise Completa - {analysis.fileName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{analysis.slideContents.length}</div>
                  <div className="text-sm text-gray-600">Slides Analisados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analysis.detectedNRs.length}</div>
                  <div className="text-sm text-gray-600">NRs Detectadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(analysis.overallCompliance)}%</div>
                  <div className="text-sm text-gray-600">Conformidade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{analysis.processingTime.toFixed(1)}s</div>
                  <div className="text-sm text-gray-600">Tempo de Análise</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Tabs defaultValue="nrs" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="nrs">NRs Detectadas</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
              <TabsTrigger value="content">Conteúdo Extraído</TabsTrigger>
            </TabsList>

            <TabsContent value="nrs" className="space-y-4">
              {analysis.detectedNRs.map((nr, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{nr.nrCode}</h3>
                        <p className="text-gray-600">{nr.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskColor(nr.riskLevel)}>
                          Risco {nr.riskLevel === 'high' ? 'Alto' : nr.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                        <div className={cn("text-lg font-bold", getConfidenceColor(nr.confidence))}>
                          {Math.round(nr.confidence)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Tópicos Identificados:</h6>
                        <div className="flex flex-wrap gap-1">
                          {nr.keyTopics.map((topic, topicIndex) => (
                            <span key={topicIndex} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Slides Relevantes:</h6>
                        <div className="flex flex-wrap gap-1">
                          {nr.relevantSlides.map((slideNum, slideIndex) => (
                            <span key={slideIndex} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                              Slide {slideNum}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Templates Sugeridos</h4>
                      <div className="flex gap-2">
                        {nr.suggestedTemplates.map(template => (
                          <Button key={template} variant="outline" size="sm">
                            <Zap className="h-3 w-3 mr-1" />
                            {template}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recomendações de Melhoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Texto Extraído</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.extractedText.map((text, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Gerar Vídeo Automaticamente
            </Button>
            <Button variant="outline" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedPPTXUpload