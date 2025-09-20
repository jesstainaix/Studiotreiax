/**
 * Shared types for PPTX processing system
 * This module contains only type definitions to avoid circular dependencies
 */

export interface AIAnalysisResult {
  suggestions: string[];
  improvements: string[];
  qualityScore: number;
}

export interface ComplexElement {
  id: string;
  type: 'chart' | 'table' | 'smartart' | 'embedded' | 'animation' | 'video' | 'audio';
  position: { x: number; y: number; width: number; height: number };
  data: any;
  metadata?: Record<string, any>;
}

export type ProgressCallback = (progress: number, message: string) => void;

export interface PPTXSlide {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  images?: Array<{
    url: string;
    alt: string;
    position?: { x: number; y: number; width: number; height: number };
    width?: number;
    height?: number;
  }>;
  notes?: string;
  layout: 'title' | 'content' | 'image' | 'mixed';
  duration: number; // in seconds
  textContent?: string[];
  bulletPoints?: string[];
  shapes?: Array<{ type: string; content: string }>;
  slideNumber?: number;
  complexElements?: ComplexElement[];
  complexElementsMetadata?: {
    extractionTime: number;
    totalElements: number;
    elementTypes: Record<string, number>;
    errors: number;
    warnings: number;
  };
  animations?: Array<{
    type: string;
    duration: number;
    delay: number;
  }>;
}

export interface PPTXProject {
  id: string;
  name: string;
  description: string;
  slides: PPTXSlide[];
  totalDuration: number;
  category: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  aiAnalysis: AIAnalysisResult;
  metadata: {
    originalFileName: string;
    uploadDate: Date;
    fileSize: number;
    slideCount: number;
    extractedAt?: string;
    processingTime?: number;
    aiEnabled?: boolean;
    cacheKey?: string;
    validation?: {
      isValid: boolean;
      errorsCount: number;
      warningsCount: number;
      extractedElements: {
        titles: number;
        textContent: number;
        images: number;
        bulletPoints: number;
        shapes: number;
      };
      missingData: string[];
    };
    autoCorrection?: {
      applied: boolean;
      correctionsCount: number;
      corrections: string[];
      confidence: number;
    };
  };
  settings: {
    theme: string;
    transitions: boolean;
    animations: boolean;
  };
}

export interface ExtractedContent {
  text: string;
  images: Array<{
    url: string;
    alt: string;
    position?: { x: number; y: number; width: number; height: number };
  }>;
  structure: {
    title: string;
    sections: Array<{
      heading: string;
      content: string[];
      images?: Array<{
        url: string;
        alt: string;
        position?: { x: number; y: number; width: number; height: number };
      }>;
      textContent?: string[];
      bulletPoints?: string[];
      shapes?: Array<{ type: string; content: string }>;
    }>;
  };
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  extractedElements: {
    titles: number;
    textContent: number;
    images: number;
    bulletPoints: number;
    shapes: number;
  };
  missingData: string[];
}

// Auto-correction types
export interface AutoCorrectionConfig {
  enableSpellCheck: boolean;
  enableGrammarCheck: boolean;
  enableContentSuggestions: boolean;
  confidence: number;
}

// Processing task types
export interface ProcessingTask {
  id: string;
  type: 'extract' | 'validate' | 'correct' | 'analyze';
  data: any;
  priority: number;
}

// Cache types
export interface CacheStats {
  hits: number;
  misses: number;
  totalSize: number;
  evictions: number;
}