import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Upload, 
  FileText, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Download, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Shield, 
  Layers
} from 'lucide-react'
import { toast } from 'sonner'
import { OCRService } from '../../services/ocr-service'
import { AITemplateService } from '../../services/aiTemplateService'

interface ConversionProgress {
  stage: 'upload' | 'ocr' | 'ai-analysis' | 'template-matching' | 'generation' | 'complete'
  progress: number
  message: string
  timeElapsed: number
  estimatedTimeRemaining: number
}

interface OCRResults {
  totalSlides: number
  textExtracted: number
  nrDetected: boolean
  nrConfidence: number
  processingTime: number
  imageQuality: number
  detectedElements: string[]
}

interface TemplateRecommendation {
  id: string
  name: string
  category: string
  confidence: number
  reasons: string[]
  preview: string
  estimatedTime: number
  nrCompliant?: boolean
}

interface ConversionResult {
  success: boolean
  outputPath?: string
  templateUsed?: string
  processingTime: number
  qualityScore: number
  optimizations: string[]
}

export const EnhancedPPTXConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState<ConversionProgress>({
    stage: 'upload',
    progress: 0,
    message: 'Ready to upload',
    timeElapsed: 0,
    estimatedTimeRemaining: 0
  })
  const [ocrResults, setOcrResults] = useState<OCRResults | null>(null)
  const [templateRecommendations, setTemplateRecommendations] = useState<TemplateRecommendation[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [activeTab, setActiveTab] = useState('upload')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<number>(0)
  const ocrServiceRef = useRef<OCRService | null>(null)
  const aiServiceRef = useRef<AITemplateService | null>(null)

  // Initialize services
  React.useEffect(() => {
    const initializeServices = async () => {
      try {
        ocrServiceRef.current = OCRService.getInstance()
        await ocrServiceRef.current.initialize()
        
        aiServiceRef.current = new AITemplateService()
        await aiServiceRef.current.initialize()
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing services:', error)
        toast.error('Erro ao inicializar serviços')
      }
    }
    
    initializeServices()
  }, [])

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'upload': return <Upload className="w-4 h-4" />
      case 'ocr': return <Eye className="w-4 h-4" />
      case 'ai-analysis': return <Sparkles className="w-4 h-4" />
      case 'template-matching': return <Target className="w-4 h-4" />
      case 'generation': return <Zap className="w-4 h-4" />
      case 'complete': return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Enhanced PPTX Converter</h1>
        <p className="text-gray-600">Convert PowerPoint presentations to videos with AI-powered template suggestions</p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Target: &lt;30s processing</span>
          </div>
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            <span>NR compliance detection</span>
          </div>
          <div className="flex items-center">
            <Sparkles className="w-4 h-4 mr-1" />
            <span>AI template matching</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isConverting && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStageIcon(progress.stage)}
                  <span className="font-medium capitalize">{progress.stage.replace('-', ' ')}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatTime(progress.timeElapsed)}
                  {progress.estimatedTimeRemaining > 0 && (
                    <span> / ~{formatTime(progress.estimatedTimeRemaining)}</span>
                  )}
                </div>
              </div>
              
              <Progress value={progress.progress} className="w-full" />
              
              <p className="text-sm text-gray-600">{progress.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={!file}>
            <Eye className="w-4 h-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="templates" disabled={!ocrResults}>
            <Layers className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!conversionResult}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Result
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select PPTX File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {file ? file.name : 'Click to select PPTX file'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {file 
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB` 
                      : 'Maximum file size: 50MB'
                    }
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {file && (
                  <div className="flex justify-center">
                    <Button onClick={startConversion} disabled={isConverting} size="lg">
                      <Zap className="w-4 h-4 mr-2" />
                      Start Conversion
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {ocrResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    OCR Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{ocrResults.totalSlides}</div>
                      <div className="text-sm text-gray-500">Total Slides</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{ocrResults.textExtracted}</div>
                      <div className="text-sm text-gray-500">Text Extracted</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Processing Time:</span>
                      <span>{Math.round(ocrResults.processingTime / 1000)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Image Quality:</span>
                      <span>{Math.round(ocrResults.imageQuality * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    NR Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>NR Content Detected:</span>
                    <Badge variant={ocrResults.nrDetected ? 'default' : 'secondary'}>
                      {ocrResults.nrDetected ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  
                  {ocrResults.nrDetected && (
                    <>
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span>{Math.round(ocrResults.nrConfidence * 100)}%</span>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Detected Elements:</span>
                        <div className="flex flex-wrap gap-1">
                          {ocrResults.detectedElements.map((element, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {element}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recommended Templates</h3>
              <Badge variant="outline">
                {templateRecommendations.length} recommendations
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templateRecommendations.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      {template.nrCompliant && (
                        <Badge variant="default" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          NR
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{template.category}</span>
                      <span>{Math.round(template.confidence * 100)}%</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="aspect-video bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-xs text-gray-500">Preview</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Est. Time:</span>
                        <span>{Math.round(template.estimatedTime / 1000)}s</span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-xs font-medium">Why this template:</span>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {template.reasons.slice(0, 2).map((reason, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {selectedTemplate && (
              <div className="flex justify-center pt-4">
                <Button onClick={finalizeConversion} disabled={isConverting} size="lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Video
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result" className="space-y-6">
          {conversionResult && (
            <div className="space-y-6">
              {conversionResult.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Video conversion completed successfully in {formatTime(conversionResult.processingTime)}!
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Conversion failed. Please try again.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Processing Time:</span>
                        <span>{formatTime(conversionResult.processingTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality Score:</span>
                        <span>{Math.round(conversionResult.qualityScore * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Template Used:</span>
                        <span>{conversionResult.templateUsed}</span>
                      </div>
                    </div>
                    
                    {conversionResult.outputPath && (
                      <Button className="w-full" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Video
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Optimizations Applied</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {conversionResult.optimizations.map((optimization, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm">{optimization}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedPPTXConverter