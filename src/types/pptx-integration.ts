// Types for PPTX to Video Editor Pipeline Integration

export interface OCRResult {
  id: string;
  slideNumber: number;
  text: string;
  confidence: number;
  language: string;
  hasImages: boolean;
  hasCharts: boolean;
  hasTables: boolean;
  wordCount: number;
  readabilityScore: number;
  nrKeywords: string[];
  safetyTerms: string[];
  complianceLevel: 'high' | 'medium' | 'low';
  processingTime: number;
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface AITemplateRecommendation {
  id: string;
  name: string;
  description: string;
  category: 'safety' | 'training' | 'compliance' | 'general';
  confidence: number;
  reasons: string[];
  preview: string;
  estimatedTime: number;
  nrCompliant: boolean;
  features: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface ConversionResult {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  fileSize: number;
  quality: 'HD' | 'FHD' | '4K';
  format: 'mp4' | 'webm' | 'avi';
  metadata: {
    title: string;
    description: string;
    tags: string[];
    category: string;
    nrCompliant: boolean;
    complianceScore: number;
  };
}

export interface PerformanceMetrics {
  totalProcessingTime: number;
  ocrProcessingTime: number;
  aiAnalysisTime: number;
  videoGenerationTime: number;
  fileUploadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
}

export interface PPTXConversionData {
  result: ConversionResult;
  ocrResults: OCRResult[];
  selectedTemplate: AITemplateRecommendation;
  performanceMetrics: PerformanceMetrics;
  originalFile: File;
}

// Timeline integration types
export interface PPTXSlideAsset {
  id: string;
  slideNumber: number;
  text: string;
  imageUrl?: string;
  duration: number;
  startTime: number;
  endTime: number;
  ocrData: OCRResult;
}

export interface PPTXProjectData {
  id: string;
  name: string;
  description: string;
  originalFileName: string;
  totalDuration: number;
  slidesCount: number;
  slides: PPTXSlideAsset[];
  template: AITemplateRecommendation;
  metadata: {
    nrCompliant: boolean;
    complianceScore: number;
    safetyLevel: 'high' | 'medium' | 'low';
    tags: string[];
    category: string;
  };
  conversionData: PPTXConversionData;
  createdAt: Date;
  updatedAt: Date;
}