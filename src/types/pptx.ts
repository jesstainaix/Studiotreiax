// Tipos compartilhados para evitar dependências circulares

export interface SlideContent {
  slideNumber: number
  title: string
  content: string
  images: Array<{
    src: string
    alt: string
    position: { x: number; y: number; width: number; height: number }
  }>
  charts: Array<{
    type: 'bar' | 'line' | 'pie' | 'scatter'
    data: any
    title: string
  }>
  animations: Array<{
    element: string
    type: string
    duration: number
  }>
  notes: string
  layout: string
  complexity: number
}

export interface NRDetectionResult {
  nrId: string
  title: string
  confidence: number
  matchedKeywords: string[]
  relevantSlides: number[]
  complianceLevel: 'full' | 'partial' | 'none'
  recommendations: string[]
  riskFactors: string[]
  requiredActions: string[]
}

export interface ContentAnalysisResult {
  slides: SlideContent[]
  detectedNRs: NRDetectionResult[]
  overallComplexity: 'basic' | 'intermediate' | 'advanced'
  estimatedReadingTime: number
  keyTopics: Array<{
    topic: string
    relevance: number
    slides: number[]
  }>
  learningObjectives: string[]
  targetAudience: string
  improvementSuggestions: Array<{
    type: 'content' | 'structure' | 'visual' | 'accessibility'
    priority: 'high' | 'medium' | 'low'
    description: string
    affectedSlides: number[]
  }>
  qualityMetrics: {
    textQuality: number
    visualQuality: number
    structureQuality: number
    accessibilityScore: number
    overallScore: number
  }
}