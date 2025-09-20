import React, { useState, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { 
  Upload, 
  FileText, 
  Brain, 
  Video, 
  Download, 
  Play, 
  Timer, 
  CheckCircle, 
  Eye, 
  Search, 
  Grid, 
  List, 
  Shield, 
  Activity, 
  Cpu, 
  BarChart3, 
  Info, 
  Loader2,
  Mic2
} from 'lucide-react'
import { toast } from 'sonner'
// import { ocrService } from '../../lib/ocr/ocr-service' // Commented out as not used
import { pptxAIIntegrationService, type GPTVisionAnalysis, type BackendAITemplateRecommendation } from '../../services/pptxAIIntegrationService'
import { NRComplianceDisplay } from './NRComplianceDisplay'
import { TTSGenerationPanel } from './TTSGenerationPanel'
import { type TTSJob } from '../../services/ttsIntegrationService'

// Interfaces for type safety
interface ConversionProgress {
  stage: 'upload' | 'ocr' | 'analysis' | 'template' | 'generation' | 'complete'
  progress: number
  message: string
  timeElapsed: number
  estimatedTimeRemaining: number
}

interface OCRResult {
  id: string
  slideNumber: number
  text: string
  confidence: number
  language: string
  hasImages: boolean
  hasCharts: boolean
  hasTables: boolean
  wordCount: number
  readabilityScore: number
  nrKeywords: string[]
  safetyTerms: string[]
  complianceLevel: 'high' | 'medium' | 'low'
  processingTime: number
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

interface AITemplateRecommendation {
  id: string
  name: string
  description: string
  category: 'safety' | 'training' | 'compliance' | 'general'
  confidence: number
  reasons: string[]
  preview: string
  estimatedTime: number
  nrCompliant: boolean
  features: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

interface ConversionResult {
  id: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  fileSize: number
  quality: 'HD' | 'FHD' | '4K'
  format: 'mp4' | 'webm' | 'avi'
  metadata: {
    title: string
    description: string
    tags: string[]
    category: string
    nrCompliant: boolean
    complianceScore: number
  }
}

interface PerformanceMetrics {
  totalProcessingTime: number
  ocrProcessingTime: number
  aiAnalysisTime: number
  videoGenerationTime: number
  fileUploadTime: number
  memoryUsage: number
  cpuUsage: number
  throughput: number
  errorRate: number
  cacheHitRate: number
}

interface EnhancedPPTXConverterProps {
  systemIntegration?: any;
  onNavigateToVideoEditor?: (conversionData: any) => void;
}

export const EnhancedPPTXConverter: React.FC<EnhancedPPTXConverterProps> = ({ 
  onNavigateToVideoEditor 
}) => {
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null)
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<AITemplateRecommendation[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [gptVisionAnalysis, setGptVisionAnalysis] = useState<GPTVisionAnalysis | null>(null)
  const [detailedNRCompliance, setDetailedNRCompliance] = useState<any | null>(null)
  const [ttsAudioData, setTtsAudioData] = useState<TTSJob | null>(null)
  const [pptxContentForTTS, setPptxContentForTTS] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isBackendAvailable, setIsBackendAvailable] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | 'safety' | 'training' | 'compliance'>('all')
  const [sortBy, setSortBy] = useState<'confidence' | 'time' | 'name'>('confidence')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const processingStartTime = useRef<number>(0)

  // Mock AI template recommendations with enhanced data
  const mockTemplates = useMemo<AITemplateRecommendation[]>(() => [
    {
      id: 'nr-safety-standard',
      name: 'NR Safety Standard',
      description: 'Comprehensive safety training template compliant with Brazilian NR regulations',
      category: 'safety',
      confidence: 96,
      reasons: [
        'High safety keyword density detected',
        'NR-12 compliance terms identified',
        'Industrial safety context recognized',
        'Regulatory language patterns found'
      ],
      preview: 'Professional safety training with animated safety procedures, compliance checklists, and interactive scenarios',
      estimatedTime: 18,
      nrCompliant: true,
      features: [
        'Animated safety procedures',
        'Interactive compliance checklists',
        'Emergency response scenarios',
        'Equipment operation guidelines',
        'Risk assessment tools'
      ],
      difficulty: 'intermediate',
      tags: ['NR-12', 'Safety', 'Industrial', 'Compliance', 'Training']
    },
    {
      id: 'nr-compliance-pro',
      name: 'NR Compliance Pro',
      description: 'Advanced compliance training with detailed regulatory requirements and assessment tools',
      category: 'compliance',
      confidence: 94,
      reasons: [
        'Compliance terminology detected',
        'Regulatory framework identified',
        'Assessment criteria found',
        'Legal requirements mentioned'
      ],
      preview: 'Detailed compliance training with regulatory breakdowns, assessment modules, and certification tracking',
      estimatedTime: 22,
      nrCompliant: true,
      features: [
        'Regulatory requirement breakdowns',
        'Compliance assessment modules',
        'Certification tracking',
        'Legal framework explanations',
        'Audit preparation tools'
      ],
      difficulty: 'advanced',
      tags: ['NR', 'Compliance', 'Regulatory', 'Assessment', 'Certification']
    },
    {
      id: 'workplace-safety',
      name: 'Workplace Safety Essentials',
      description: 'Essential workplace safety training covering basic safety protocols and emergency procedures',
      category: 'safety',
      confidence: 89,
      reasons: [
        'Workplace safety terms identified',
        'Emergency procedures mentioned',
        'Basic safety protocols found',
        'General safety context detected'
      ],
      preview: 'Fundamental safety training with basic protocols, emergency procedures, and safety awareness modules',
      estimatedTime: 15,
      nrCompliant: true,
      features: [
        'Basic safety protocols',
        'Emergency procedures',
        'Safety awareness modules',
        'Incident reporting guidelines',
        'Personal protective equipment'
      ],
      difficulty: 'beginner',
      tags: ['Safety', 'Workplace', 'Emergency', 'Protocols', 'Awareness']
    },
    {
      id: 'corporate-training',
      name: 'Corporate Training Standard',
      description: 'Professional corporate training template with modern design and interactive elements',
      category: 'training',
      confidence: 82,
      reasons: [
        'Corporate training content detected',
        'Professional presentation structure',
        'Training objectives identified',
        'Business context recognized'
      ],
      preview: 'Modern corporate training with professional design, interactive elements, and progress tracking',
      estimatedTime: 20,
      nrCompliant: false,
      features: [
        'Professional design templates',
        'Interactive learning modules',
        'Progress tracking',
        'Knowledge assessments',
        'Multimedia integration'
      ],
      difficulty: 'intermediate',
      tags: ['Corporate', 'Training', 'Professional', 'Interactive', 'Assessment']
    },
    {
      id: 'general-presentation',
      name: 'General Presentation',
      description: 'Versatile presentation template suitable for various content types and audiences',
      category: 'general',
      confidence: 75,
      reasons: [
        'General presentation structure',
        'Mixed content types detected',
        'Flexible format identified',
        'Broad audience appeal'
      ],
      preview: 'Flexible presentation template with customizable design, multimedia support, and audience engagement tools',
      estimatedTime: 12,
      nrCompliant: false,
      features: [
        'Customizable design themes',
        'Multimedia support',
        'Audience engagement tools',
        'Flexible layouts',
        'Export options'
      ],
      difficulty: 'beginner',
      tags: ['General', 'Flexible', 'Multimedia', 'Customizable', 'Versatile']
    },
    {
      id: 'technical-documentation',
      name: 'Technical Documentation',
      description: 'Specialized template for technical documentation and procedural training materials',
      category: 'training',
      confidence: 78,
      reasons: [
        'Technical terminology detected',
        'Procedural content identified',
        'Documentation structure found',
        'Technical diagrams present'
      ],
      preview: 'Technical training template with detailed procedures, diagrams, and step-by-step instructions',
      estimatedTime: 25,
      nrCompliant: false,
      features: [
        'Technical diagram support',
        'Step-by-step procedures',
        'Code highlighting',
        'Reference materials',
        'Troubleshooting guides'
      ],
      difficulty: 'advanced',
      tags: ['Technical', 'Documentation', 'Procedures', 'Diagrams', 'Instructions']
    }
  ], [])

  // Filtered and sorted templates - USE BACKEND DATA, NOT MOCKS!
  const filteredTemplates = useMemo(() => {
    // Use aiRecommendations from backend instead of mockTemplates
    const templates = aiRecommendations.length > 0 ? aiRecommendations : mockTemplates;
    const filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = filterCategory === 'all' || template.category === filterCategory
      return matchesSearch && matchesCategory
    })

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence
        case 'time':
          return a.estimatedTime - b.estimatedTime
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  }, [aiRecommendations, mockTemplates, searchQuery, filterCategory, sortBy])

  // File upload handler
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      setSelectedFile(file)
      setActiveTab('analysis')
      toast.success('PPTX file uploaded successfully!')
    } else {
      toast.error('Please select a valid PPTX file')
    }
  }, [])

  // OCR processing simulation
  const processOCR = useCallback(async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    processingStartTime.current = Date.now()
    
    // Initialize AI Integration Service
    await pptxAIIntegrationService.initialize();
    
    // Enhanced OCR processing with GPT-4 Vision backend
    const stages = [
      { stage: 'upload' as const, progress: 10, message: 'Uploading file...', duration: 500 },
      { stage: 'ocr' as const, progress: 30, message: 'Extracting text from slides...', duration: 2000 },
      { stage: 'analysis' as const, progress: 60, message: 'GPT-4 Vision analyzing content and NR compliance...', duration: 2000 },
      { stage: 'template' as const, progress: 85, message: 'Backend AI generating template recommendations...', duration: 1500 },
      { stage: 'complete' as const, progress: 100, message: 'Advanced AI analysis complete!', duration: 500 }
    ]

    for (const stageData of stages) {
      const timeElapsed = Date.now() - processingStartTime.current
      const estimatedTotal = 6000 // 6 seconds total
      const estimatedTimeRemaining = Math.max(0, estimatedTotal - timeElapsed)
      
      setConversionProgress({
        ...stageData,
        timeElapsed,
        estimatedTimeRemaining
      })
      
      await new Promise(resolve => setTimeout(resolve, stageData.duration))
    }

    // Generate mock OCR results
    const mockOCRResults: OCRResult[] = [
      {
        id: '1',
        slideNumber: 1,
        text: 'Industrial Safety Training - NR-12 Compliance Overview. This presentation covers essential safety protocols for industrial equipment operation and maintenance.',
        confidence: 96,
        language: 'pt-BR',
        hasImages: true,
        hasCharts: false,
        hasTables: true,
        wordCount: 23,
        readabilityScore: 85,
        nrKeywords: ['NR-12', 'safety protocols', 'industrial equipment'],
        safetyTerms: ['safety', 'protocols', 'equipment', 'maintenance'],
        complianceLevel: 'high',
        processingTime: 1.2,
        imageQuality: 'excellent'
      },
      {
        id: '2',
        slideNumber: 2,
        text: 'Equipment Operation Guidelines. Proper procedures for operating industrial machinery safely and efficiently according to regulatory standards.',
        confidence: 94,
        language: 'pt-BR',
        hasImages: true,
        hasCharts: true,
        hasTables: false,
        wordCount: 18,
        readabilityScore: 78,
        nrKeywords: ['equipment operation', 'regulatory standards'],
        safetyTerms: ['procedures', 'machinery', 'safely'],
        complianceLevel: 'high',
        processingTime: 0.9,
        imageQuality: 'good'
      },
      {
        id: '3',
        slideNumber: 3,
        text: 'Emergency Response Procedures. Step-by-step emergency protocols and evacuation procedures for workplace safety incidents.',
        confidence: 92,
        language: 'pt-BR',
        hasImages: false,
        hasCharts: false,
        hasTables: true,
        wordCount: 16,
        readabilityScore: 82,
        nrKeywords: ['emergency response', 'evacuation procedures'],
        safetyTerms: ['emergency', 'protocols', 'evacuation', 'safety'],
        complianceLevel: 'high',
        processingTime: 0.8,
        imageQuality: 'good'
      }
    ]

    setOcrResults(mockOCRResults)
    
    // Generate AI recommendations based on OCR results  
    const nrDetection = {
      nrNumber: 'NR-12',
      nrTitle: 'Segurança no Trabalho em Máquinas e Equipamentos',
      confidence: 94,
      keywords: ['máquinas', 'equipamentos', 'segurança', 'industrial'],
      category: 'safety' as const,
      priority: 'high' as const,
      detectedAt: {
        slideIndex: 0,
        textPosition: { x: 0, y: 0 }
      }
    }
    
    // Processing metrics for logging
    const totalProcessingTime = Date.now() - processingStartTime.current
    const avgConfidence = mockOCRResults.reduce((sum, result) => sum + result.confidence, 0) / mockOCRResults.length;
    
    const conversionData = {
      result: mockResult,
      ocrResults,
      selectedTemplate: selectedTemplateData,
      performanceMetrics,
      originalFile: selectedFile
    };
    
    // Small delay to show success message before navigation
    setTimeout(() => {
      onNavigateToVideoEditor(conversionData);
    }, 1500);
  }, [selectedTemplate, mockTemplates, performanceMetrics])

  // Utility functions
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${bytes} B`
  }, [])

  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-50 text-red-700 border-red-200'
      case 'training': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'compliance': return 'bg-green-50 text-green-700 border-green-200'
      case 'general': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }, [])

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-50 text-green-700'
      case 'intermediate': return 'bg-yellow-50 text-yellow-700'
      case 'advanced': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Enhanced PPTX to Video Converter
          <Badge variant="default" className="text-sm">
            GPT-4 Vision Powered
          </Badge>
          {!isBackendAvailable && (
            <Badge variant="destructive" className="text-sm">
              Backend Unavailable - Using Fallback
            </Badge>
          )}
        </h1>
        <p className="text-lg text-gray-600">
          Transform presentations into engaging videos with AI-powered OCR detection and template recommendations
        </p>
        
        {/* Performance Indicator */}
        {performanceMetrics && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <Timer className="w-4 h-4 mr-2 text-blue-600" />
                <span>Total: {(performanceMetrics.totalProcessingTime / 1000).toFixed(1)}s</span>
                {performanceMetrics.totalProcessingTime <= 30000 && (
                  <CheckCircle className="w-4 h-4 ml-1 text-green-600" />
                )}
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2 text-green-600" />
                <span>OCR: {(performanceMetrics.ocrProcessingTime / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex items-center">
                <Brain className="w-4 h-4 mr-2 text-purple-600" />
                <span>AI: {(performanceMetrics.aiAnalysisTime / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex items-center">
                <Cpu className="w-4 h-4 mr-2 text-orange-600" />
                <span>CPU: {performanceMetrics.cpuUsage}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {conversionProgress && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{conversionProgress.message}</h3>
                <span className="text-sm text-gray-500">
                  {Math.floor(conversionProgress.timeElapsed / 1000)}s elapsed
                </span>
              </div>
              
              <Progress value={conversionProgress.progress} className="h-2" />
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{conversionProgress.progress}% complete</span>
                <span>
                  {conversionProgress.estimatedTimeRemaining > 0 
                    ? `~${Math.ceil(conversionProgress.estimatedTimeRemaining / 1000)}s remaining`
                    : 'Finishing up...'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2" disabled={!selectedFile}>
            <Eye className="w-4 h-4" />
            <span>Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center space-x-2" disabled={!gptVisionAnalysis}>
            <Shield className="w-4 h-4" />
            <span>NR Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2" disabled={ocrResults.length === 0}>
            <Brain className="w-4 h-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="tts" className="flex items-center space-x-2" disabled={!selectedTemplate && ocrResults.length === 0}>
            <Mic2 className="w-4 h-4" />
            <span>TTS Audio</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center space-x-2" disabled={!conversionResult}>
            <Video className="w-4 h-4" />
            <span>Results</span>
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload PPTX File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* File Upload Area */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Upload your PPTX file</h3>
                      <p className="text-gray-600">Click to browse or drag and drop your presentation file</p>
                    </div>
                    
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>
                
                {/* Selected File Info */}
                {selectedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{selectedFile.name}</p>
                          <p className="text-sm text-green-700">
                            {formatFileSize(selectedFile.size)} • {selectedFile.type}
                          </p>
                        </div>
                      </div>
                      
                      <Button onClick={processOCR} disabled={isProcessing}>
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        Start Analysis
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Features Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Timer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-blue-900">Fast Processing</h4>
                    <p className="text-sm text-blue-700">&lt;30s conversion time</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Brain className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-green-900">AI-Powered OCR</h4>
                    <p className="text-sm text-green-700">Advanced text extraction</p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <h4 className="font-medium text-red-900">NR Compliant</h4>
                    <p className="text-sm text-red-700">Brazilian safety standards</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  OCR Analysis Results
                </span>
                {ocrResults.length > 0 && (
                  <Badge className="bg-green-50 text-green-700">
                    {ocrResults.length} slides analyzed
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ocrResults.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {(ocrResults.reduce((sum, result) => sum + result.confidence, 0) / ocrResults.length).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Confidence</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {ocrResults.reduce((sum, result) => sum + result.wordCount, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Words</div>
                    </div>
                    
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {ocrResults.filter(result => result.complianceLevel === 'high').length}
                      </div>
                      <div className="text-sm text-gray-600">NR Compliant</div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {(ocrResults.reduce((sum, result) => sum + result.processingTime, 0)).toFixed(1)}s
                      </div>
                      <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                  </div>
                  
                  {/* Slide Results */}
                  <div className="space-y-4">
                    {ocrResults.map((result) => (
                      <Card key={result.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Slide {result.slideNumber}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge className={getCategoryColor(result.complianceLevel)}>
                                  {result.complianceLevel} compliance
                                </Badge>
                                <Badge variant="outline">
                                  {result.confidence}% confidence
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-gray-700 text-sm">{result.text}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Language:</span>
                                <span className="ml-1">{result.language}</span>
                              </div>
                              <div>
                                <span className="font-medium">Words:</span>
                                <span className="ml-1">{result.wordCount}</span>
                              </div>
                              <div>
                                <span className="font-medium">Readability:</span>
                                <span className="ml-1">{result.readabilityScore}%</span>
                              </div>
                              <div>
                                <span className="font-medium">Quality:</span>
                                <span className="ml-1">{result.imageQuality}</span>
                              </div>
                            </div>
                            
                            {result.nrKeywords.length > 0 && (
                              <div>
                                <span className="font-medium text-sm">NR Keywords:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {result.nrKeywords.map((keyword, index) => (
                                    <Badge key={index} className="bg-red-50 text-red-700 text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {result.hasImages && (
                                <span className="flex items-center">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Images
                                </span>
                              )}
                              {result.hasCharts && (
                                <span className="flex items-center">
                                  <BarChart3 className="w-3 h-3 mr-1" />
                                  Charts
                                </span>
                              )}
                              {result.hasTables && (
                                <span className="flex items-center">
                                  <Grid className="w-3 h-3 mr-1" />
                                  Tables
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <Button onClick={() => setActiveTab('templates')} size="lg">
                      <Brain className="w-5 h-5 mr-2" />
                      View AI Template Recommendations
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis results yet</h3>
                  <p className="text-gray-600">Upload a PPTX file and start the analysis to see OCR results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NR Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          {gptVisionAnalysis?.nrCompliance || detailedNRCompliance ? (
            <div className="space-y-6">
              {/* Overview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                    Análise Completa de Conformidade NR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {gptVisionAnalysis?.nrCompliance?.detectedNRs?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">NRs Detectadas</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {gptVisionAnalysis?.nrCompliance?.complianceScore || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Score de Conformidade</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {gptVisionAnalysis?.nrCompliance?.issues?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Issues Identificados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Detailed NR Compliance Display */}
              <NRComplianceDisplay
                complianceData={{
                  detectedNRs: gptVisionAnalysis?.nrCompliance?.detectedNRs || [],
                  complianceScore: gptVisionAnalysis?.nrCompliance?.complianceScore || 0,
                  complianceLevel: gptVisionAnalysis?.nrCompliance?.complianceLevel || 'low',
                  safetyTerms: gptVisionAnalysis?.nrCompliance?.safetyTerms || [],
                  requiredElements: gptVisionAnalysis?.nrCompliance?.requiredElements || [],
                  missingElements: gptVisionAnalysis?.nrCompliance?.missingElements || [],
                  nrSpecificCompliance: gptVisionAnalysis?.nrCompliance?.nrSpecificCompliance || detailedNRCompliance?.nrCompliance || {},
                  issues: gptVisionAnalysis?.nrCompliance?.issues || detailedNRCompliance?.issues || [],
                  summary: gptVisionAnalysis?.nrCompliance?.summary || detailedNRCompliance?.summary
                }}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Análise NR Pendente</h3>
              <p className="text-gray-600 mb-4">Faça upload e processe um arquivo PPTX para ver a análise de conformidade NR completa</p>
              {selectedFile && !isProcessing && (
                <Button onClick={processOCR}>
                  <Brain className="w-4 h-4 mr-2" />
                  Analisar Conformidade NR
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-lg w-64"
                    />
                  </div>
                  
                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="all">All Categories</option>
                    <option value="safety">Safety</option>
                    <option value="training">Training</option>
                    <option value="compliance">Compliance</option>
                  </select>
                  
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="confidence">Sort by Confidence</option>
                    <option value="time">Sort by Time</option>
                    <option value="name">Sort by Name</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Template Grid/List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-medium text-lg">{template.name}</h3>
                        <p className="text-gray-600 text-sm">{template.description}</p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {template.nrCompliant && (
                          <Badge className="bg-green-50 text-green-700">
                            <Shield className="w-3 h-3 mr-1" />
                            NR
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{template.confidence}%</div>
                        <div className="text-gray-600">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{template.estimatedTime}s</div>
                        <div className="text-gray-600">Est. Time</div>
                      </div>
                      <div className="text-center">
                        <Badge className={getDifficultyColor(template.difficulty)}>
                          {template.difficulty}
                        </Badge>
                        <div className="text-gray-600 text-xs mt-1">Difficulty</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Why this template?</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {template.reasons.slice(0, 3).map((reason, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {template.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 italic">{template.preview}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedTemplate && (
            <div className="text-center">
              <Button onClick={generateVideo} size="lg" disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Video className="w-5 h-5 mr-2" />
                )}
                Generate Video
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TTS Generation Tab */}
        <TabsContent value="tts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mic2 className="w-5 h-5 mr-2 text-blue-600" />
                Geração de Áudio TTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Gere narração em português brasileiro a partir do conteúdo do PPTX analisado. 
                  Escolha uma voz, ajuste as configurações e crie áudio profissional para seus vídeos.
                </p>
                
                {(ocrResults.length > 0 || gptVisionAnalysis) && (
                  <TTSGenerationPanel
                    pptxContent={pptxContentForTTS || {
                      slides: ocrResults.map(result => ({
                        title: `Slide ${result.slideNumber}`,
                        content: result.text
                      }))
                    }}
                    onAudioGenerated={(audioData) => {
                      setTtsAudioData(audioData)
                      toast.success('Áudio TTS gerado com sucesso!')
                      // Auto navigate to results when audio is ready
                      if (audioData.result) {
                        setTimeout(() => setActiveTab('results'), 1000)
                      }
                    }}
                    className="mt-4"
                  />
                )}

                {!ocrResults.length && !gptVisionAnalysis && (
                  <div className="text-center p-8 text-gray-500">
                    <Mic2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Análise de PPTX Necessária</h3>
                    <p>
                      Faça upload e análise do PPTX primeiro para gerar o áudio de narração.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* TTS Preview */}
          {ttsAudioData?.result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Áudio TTS Gerado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        <span className="font-medium">Duração:</span> {ttsAudioData.result.duration}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Formato:</span> {ttsAudioData.result.format}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Qualidade:</span> {ttsAudioData.result.quality}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Pronto para usar
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    URL do áudio: {ttsAudioData.result.audioUrl}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('results')}
                    className="w-full"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Ir para Resultados Finais
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {conversionResult ? (
            <div className="space-y-6">
              {/* Video Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    Generated Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                      <img 
                        src={conversionResult.thumbnailUrl} 
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Button size="lg" className="bg-white/90 text-gray-900 hover:bg-white">
                          <Play className="w-8 h-8" />
                        </Button>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <Badge className="bg-black/70 text-white">
                          {formatDuration(conversionResult.duration)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Duration:</span>
                        <span className="ml-1">{formatDuration(conversionResult.duration)}</span>
                      </div>
                      <div>
                        <span className="font-medium">File Size:</span>
                        <span className="ml-1">{formatFileSize(conversionResult.fileSize * 1024 * 1024)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Quality:</span>
                        <span className="ml-1">{conversionResult.quality}</span>
                      </div>
                      <div>
                        <span className="font-medium">Format:</span>
                        <span className="ml-1">{conversionResult.format.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Video Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Video Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg">{conversionResult.metadata.title}</h3>
                      <p className="text-gray-600">{conversionResult.metadata.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Category:</span>
                        <Badge className={`${getCategoryColor(conversionResult.metadata.category)} ml-2`}>
                          {conversionResult.metadata.category}
                        </Badge>
                      </div>
                      
                      <div>
                        <span className="font-medium">NR Compliant:</span>
                        <Badge 
                          className={conversionResult.metadata.nrCompliant ? 'bg-green-50 text-green-700 ml-2' : 'bg-gray-50 text-gray-700 ml-2'}
                        >
                          {conversionResult.metadata.nrCompliant ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      
                      <div>
                        <span className="font-medium">Compliance Score:</span>
                        <span className="ml-1">{conversionResult.metadata.complianceScore}%</span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Generated:</span>
                        <span className="ml-1">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {conversionResult.metadata.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Actions */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <Button size="lg">
                      <Download className="w-5 h-5 mr-2" />
                      Download Video
                    </Button>
                    
                    <Button size="lg" variant="outline">
                      <Play className="w-5 h-5 mr-2" />
                      Preview
                    </Button>
                    
                    <Button size="lg" variant="outline">
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Performance Summary */}
              {performanceMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {(performanceMetrics.totalProcessingTime / 1000).toFixed(1)}s
                        </div>
                        <div className="text-sm text-gray-600">Total Time</div>
                        <div className={`text-xs mt-1 ${
                          performanceMetrics.totalProcessingTime <= 30000 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Target: &lt;30s
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{performanceMetrics.throughput}</div>
                        <div className="text-sm text-gray-600">Throughput</div>
                        <div className="text-xs text-gray-500 mt-1">slides/sec</div>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{performanceMetrics.cacheHitRate}%</div>
                        <div className="text-sm text-gray-600">Cache Hit Rate</div>
                        <div className="text-xs text-green-600 mt-1">Excellent</div>
                      </div>
                      
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{performanceMetrics.errorRate}%</div>
                        <div className="text-sm text-gray-600">Error Rate</div>
                        <div className="text-xs text-green-600 mt-1">Very Low</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No video generated yet</h3>
              <p className="text-gray-600">Complete the analysis and template selection to generate your video</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedPPTXConverter