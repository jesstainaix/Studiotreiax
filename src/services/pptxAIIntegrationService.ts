/**
 * PPTX AI Integration Service
 * Conecta o pipeline de conversão PPTX com a infraestrutura IA backend existente
 * Substitui o aiTemplateService local com funcionalidades completas do backend
 */

import type { NRDetectionResult } from '../lib/ocr/ocr-service';

interface PPTXContent {
  slides: Array<{
    title?: string;
    content: string;
    images: number;
    charts: number;
    tables: number;
  }>;
  totalSlides: number;
  estimatedDuration: number;
  topics: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
}

interface BackendAITemplateRecommendation {
  id: string;
  name: string;
  description: string;
  confidence: number;
  reasons: string[];
  preview: string;
  category: 'business' | 'education' | 'creative' | 'technical' | 'safety' | 'training' | 'compliance';
  estimatedTime: number;
  nrCompliance?: {
    detectedNRs: string[];
    complianceScore: number;
    requiredElements: string[];
    missingElements: string[];
  };
}

interface GPTVisionAnalysis {
  contentAnalysis: {
    topics: string[];
    complexity: 'basic' | 'intermediate' | 'advanced';
    readabilityScore: number;
    engagementScore: number;
  };
  nrCompliance: {
    detectedNRs: string[];
    complianceScore: number;
    complianceLevel: 'high' | 'medium' | 'low';
    safetyTerms: string[];
    requiredElements: string[];
    missingElements: string[];
    nrSpecificCompliance?: Record<string, {
      score: number;
      status: 'compliant' | 'partially_compliant' | 'non_compliant';
      gaps: string[];
    }>;
    issues?: Array<{
      severity: 'high' | 'medium' | 'low';
      description: string;
      location: string;
      recommendation: string;
    }>;
    summary?: {
      overallCompliance: string;
      criticalIssues: number;
      recommendedActions: number;
      estimatedFixTime: string;
    };
  };
  recommendations: string[];
  visualElements: {
    hasCharts: boolean;
    hasImages: boolean;
    hasTables: boolean;
    hasInfographics: boolean;
    visualComplexity: 'low' | 'medium' | 'high';
  };
}

class PPTXAIIntegrationService {
  private apiBaseUrl: string;
  private isInitialized = false;

  constructor() {
    // Use environment variable for API base URL, fallback to localhost for development
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Test backend connection
      const response = await fetch(`${this.apiBaseUrl}/ai/models`);
      if (!response.ok) {
        throw new Error(`Backend API not available: ${response.status}`);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to connect to backend AI services:', error);
      // Don't throw - allow graceful degradation
      console.warn('Using fallback mode - some AI features may be limited');
    }
  }

  /**
   * Analyze PPTX content using backend GPT-4 Vision API with complete NR compliance detection
   */
  async analyzeContentWithGPTVision(
    pptxContent: PPTXContent,
    _slideImages?: string[]
  ): Promise<GPTVisionAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Prepare content for comprehensive NR analysis
      const analysisRequest = {
        content: this.preparePPTXContentForBackend(pptxContent),
        nrReferences: ['NR-1', 'NR-5', 'NR-6', 'NR-10', 'NR-12', 'NR-35', 'NR-23'], // Comprehensive NR coverage
        analysisType: 'comprehensive',
        industry: 'safety_training',
        userId: 'pptx-conversion-system'
      };
      
      const response = await fetch(`${this.apiBaseUrl}/ai/analyze-compliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest)
      });

      if (!response.ok) {
        throw new Error(`AI compliance analysis failed: ${response.status}`);
      }

      const backendAnalysis = await response.json();
      
      // Transform backend response with comprehensive NR data
      return this.transformBackendAnalysis(backendAnalysis.data);

    } catch (error) {
      console.error('Complete NR compliance analysis failed:', error);
      console.warn('⚠️  Falling back to basic analysis - NR detection may be limited');
      // Return fallback analysis
      return this.getFallbackAnalysis(pptxContent);
    }
  }

  /**
   * Get detailed NR compliance analysis using backend aiService.analyzeCompliance
   */
  async getDetailedNRCompliance(
    pptxContent: PPTXContent,
    detectedNRs: string[] = []
  ): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const complianceRequest = {
        content: this.preparePPTXContentForBackend(pptxContent),
        nrReferences: detectedNRs.length > 0 ? detectedNRs : ['NR-6', 'NR-10', 'NR-12', 'NR-35'],
        analysisType: 'detailed_compliance',
        industry: 'workplace_safety',
        userId: 'pptx-analyzer'
      };

      const response = await fetch(`${this.apiBaseUrl}/ai/analyze-compliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complianceRequest)
      });

      if (!response.ok) {
        throw new Error(`Detailed compliance analysis failed: ${response.status}`);
      }

      const complianceResult = await response.json();

      return complianceResult.data;

    } catch (error) {
      console.error('Detailed NR compliance analysis failed:', error);
      return null;
    }
  }

  /**
   * Get AI template recommendations using backend AI services
   */
  async getTemplateRecommendations(
    pptxContent: PPTXContent,
    _nrDetection?: NRDetectionResult,
    gptAnalysis?: GPTVisionAnalysis
  ): Promise<BackendAITemplateRecommendation[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/script/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Template recommendations failed: ${response.status}`);
      }

      const templates = await response.json();
      
      // Enhance templates with AI-driven recommendations
      return this.enhanceTemplatesWithAI(templates.data, pptxContent, gptAnalysis);

    } catch (error) {
      console.error('Template recommendation failed:', error);
      // Return basic templates as fallback
      return this.getBasicTemplates();
    }
  }

  /**
   * Optimize PPTX content using backend AI content optimization
   */
  async optimizeContentForVideo(
    pptxContent: PPTXContent,
    targetAudience: string = 'trabalhadores',
    objectives: string[] = ['compliance', 'engagement', 'retention']
  ): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const optimizationRequest = {
        content: this.preparePPTXContentForBackend(pptxContent),
        targetAudience,
        objectives,
        constraints: ['brazilian_portuguese', 'nr_compliance', 'video_format']
      };

      const response = await fetch(`${this.apiBaseUrl}/ai/optimize-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optimizationRequest)
      });

      if (!response.ok) {
        throw new Error(`Content optimization failed: ${response.status}`);
      }

      const optimization = await response.json();
      return optimization.data;

    } catch (error) {
      console.error('Content optimization failed:', error);
      return null;
    }
  }

  /**
   * Generate enhanced script using backend AI services
   */
  async generateEnhancedScript(
    pptxContent: PPTXContent,
    customizations: any = {}
  ): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const scriptRequest = {
        topic: this.extractMainTopicFromContent(pptxContent),
        duration: pptxContent.estimatedDuration,
        audience: 'trabalhadores_brasileiros',
        nrFocus: customizations.nrFocus || 'NR-6',
        tone: customizations.tone || 'professional',
        includeQuiz: customizations.includeQuiz || true,
        include3D: customizations.include3D || false,
        sourceContent: pptxContent
      };

      const response = await fetch(`${this.apiBaseUrl}/ai/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scriptRequest)
      });

      if (!response.ok) {
        throw new Error(`Script generation failed: ${response.status}`);
      }

      const script = await response.json();
      return script.data;

    } catch (error) {
      console.error('Enhanced script generation failed:', error);
      return null;
    }
  }

  // Helper methods for data transformation and fallbacks

  private transformBackendAnalysis(backendData: any): GPTVisionAnalysis {
    
    // Extract detected NRs from compliance analysis
    const detectedNRs = Object.keys(backendData.nrCompliance || {});
    const complianceScore = backendData.score || 0;

    return {
      contentAnalysis: {
        topics: backendData.summary?.topics || this.extractTopicsFromContent(backendData),
        complexity: this.mapComplexity(backendData.summary?.complexity || 'intermediate'),
        readabilityScore: backendData.summary?.readabilityScore || 75,
        engagementScore: backendData.summary?.engagementScore || 70
      },
      nrCompliance: {
        detectedNRs,
        complianceScore,
        complianceLevel: this.mapComplianceLevel(complianceScore),
        safetyTerms: this.extractSafetyTerms(backendData),
        requiredElements: backendData.recommendations || [],
        missingElements: backendData.issues?.map((issue: any) => issue.description) || [],
        // Enhanced NR compliance data from aiService.analyzeCompliance
        nrSpecificCompliance: backendData.nrCompliance || {},
        issues: backendData.issues || [],
        summary: backendData.summary || {
          overallCompliance: `${complianceScore}%`,
          criticalIssues: backendData.issues?.filter((i: any) => i.severity === 'high').length || 0,
          recommendedActions: backendData.recommendations?.length || 0,
          estimatedFixTime: this.estimateFixTimeFromIssues(backendData.issues || [])
        }
      },
      recommendations: this.enhanceRecommendations(backendData),
      visualElements: {
        hasCharts: false, // Will be detected from PPTX content
        hasImages: false,
        hasTables: false,
        hasInfographics: false,
        visualComplexity: 'medium'
      }
    };
  }

  private extractTopicsFromContent(backendData: any): string[] {
    const topics: string[] = [];
    
    // Extract from detected NRs
    if (backendData.nrCompliance) {
      Object.keys(backendData.nrCompliance).forEach(nr => {
        topics.push(`Segurança ${nr}`);
      });
    }
    
    // Extract from issues and recommendations
    if (backendData.issues) {
      backendData.issues.forEach((issue: any) => {
        if (issue.description.includes('emergência')) topics.push('Procedimentos de Emergência');
        if (issue.description.includes('EPI')) topics.push('Equipamentos de Proteção');
        if (issue.description.includes('treinamento')) topics.push('Capacitação');
      });
    }
    
    return topics.length > 0 ? topics : ['Segurança do Trabalho'];
  }

  private extractSafetyTerms(backendData: any): string[] {
    const safetyTerms = new Set<string>();
    
    // Extract from NR compliance
    if (backendData.nrCompliance) {
      Object.keys(backendData.nrCompliance).forEach(nr => {
        safetyTerms.add(nr);
      });
    }
    
    // Extract from issues
    if (backendData.issues) {
      backendData.issues.forEach((issue: any) => {
        const desc = issue.description.toLowerCase();
        if (desc.includes('epi')) safetyTerms.add('EPI');
        if (desc.includes('emergência')) safetyTerms.add('emergência');
        if (desc.includes('segurança')) safetyTerms.add('segurança');
        if (desc.includes('risco')) safetyTerms.add('risco');
        if (desc.includes('prevenção')) safetyTerms.add('prevenção');
      });
    }
    
    return Array.from(safetyTerms);
  }

  private enhanceRecommendations(backendData: any): string[] {
    const recommendations = [...(backendData.recommendations || [])];
    
    // Add specific recommendations based on critical issues
    if (backendData.issues) {
      const highSeverityIssues = backendData.issues.filter((i: any) => i.severity === 'high');
      highSeverityIssues.forEach((issue: any) => {
        if (issue.recommendation) {
          recommendations.push(`🔴 CRÍTICO: ${issue.recommendation}`);
        }
      });
    }
    
    // Add compliance-specific recommendations
    if (backendData.nrCompliance) {
      Object.entries(backendData.nrCompliance).forEach(([nr, compliance]: [string, any]) => {
        if (compliance.status === 'partially_compliant' && compliance.gaps.length > 0) {
          recommendations.push(`📋 ${nr}: Revisar ${compliance.gaps.join(', ')}`);
        }
      });
    }
    
    return recommendations;
  }

  private estimateFixTimeFromIssues(issues: any[]): string {
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;
    
    const estimatedHours = (highCount * 2) + (mediumCount * 1) + (lowCount * 0.5);
    
    if (estimatedHours < 1) return '30 minutos';
    if (estimatedHours < 3) return '1-2 horas';
    if (estimatedHours < 6) return '3-5 horas';
    return '1-2 dias';
  }

  private preparePPTXContentForBackend(pptxContent: PPTXContent): string {
    return pptxContent.slides.map(slide => 
      `Slide: ${slide.title || 'Sem título'}\nConteúdo: ${slide.content}`
    ).join('\n\n');
  }

  // Method removed as it was not being used in current implementation

  // Method removed as it was not being used in current implementation

  private extractMainTopicFromContent(pptxContent: PPTXContent): string {
    // Extract main topic from first slide title or most common terms
    const firstSlide = pptxContent.slides[0];
    if (firstSlide?.title) {
      return firstSlide.title;
    }
    
    // Fallback to generic safety training topic
    return 'Treinamento de Segurança do Trabalho';
  }

  private enhanceTemplatesWithAI(
    templates: any[],
    pptxContent: PPTXContent,
    gptAnalysis?: GPTVisionAnalysis
  ): BackendAITemplateRecommendation[] {
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || `Template para ${pptxContent.complexity} conteúdo`,
      confidence: this.calculateTemplateConfidence(template, pptxContent, gptAnalysis),
      reasons: this.generateTemplateReasons(template, pptxContent, gptAnalysis),
      preview: template.preview || '/api/templates/preview/default.jpg',
      category: this.mapTemplateCategory(template),
      estimatedTime: template.duration || pptxContent.estimatedDuration,
      ...(gptAnalysis?.nrCompliance && { nrCompliance: gptAnalysis.nrCompliance })
    }));
  }

  private calculateTemplateConfidence(
    template: any,
    pptxContent: PPTXContent,
    gptAnalysis?: GPTVisionAnalysis
  ): number {
    let confidence = 70; // Base confidence
    
    // Increase confidence for NR-compliant content
    if (gptAnalysis?.nrCompliance?.complianceScore && gptAnalysis.nrCompliance.complianceScore > 80) {
      confidence += 20;
    }
    
    // Adjust for content complexity match
    if (template.difficulty === pptxContent.complexity) {
      confidence += 10;
    }
    
    return Math.min(confidence, 95);
  }

  private generateTemplateReasons(
    template: any,
    pptxContent: PPTXContent,
    gptAnalysis?: GPTVisionAnalysis
  ): string[] {
    const reasons = [];
    
    if (gptAnalysis?.nrCompliance?.detectedNRs && gptAnalysis.nrCompliance.detectedNRs.length > 0) {
      reasons.push(`Conteúdo NR detectado (${gptAnalysis.nrCompliance.detectedNRs.join(', ')})`);
    }
    
    if (pptxContent.complexity === template.difficulty) {
      reasons.push(`Complexidade adequada (${pptxContent.complexity})`);
    }
    
    if (pptxContent.totalSlides > 10) {
      reasons.push('Adequado para conteúdo extenso');
    }
    
    return reasons;
  }

  private mapTemplateCategory(template: any): 'business' | 'education' | 'creative' | 'technical' | 'safety' | 'training' | 'compliance' {
    if (template.category) return template.category;
    
    if (template.name.toLowerCase().includes('nr')) return 'compliance';
    if (template.name.toLowerCase().includes('segurança')) return 'safety';
    if (template.name.toLowerCase().includes('treinamento')) return 'training';
    
    return 'education';
  }

  private mapComplexity(complexity: string): 'basic' | 'intermediate' | 'advanced' {
    if (complexity.includes('basic') || complexity.includes('simples')) return 'basic';
    if (complexity.includes('advanced') || complexity.includes('avançado')) return 'advanced';
    return 'intermediate';
  }

  private mapComplianceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  // Fallback methods when backend is not available

  private getFallbackAnalysis(pptxContent: PPTXContent): GPTVisionAnalysis {
    return {
      contentAnalysis: {
        topics: pptxContent.topics,
        complexity: pptxContent.complexity,
        readabilityScore: 75,
        engagementScore: 70
      },
      nrCompliance: {
        detectedNRs: [],
        complianceScore: 50,
        complianceLevel: 'medium',
        safetyTerms: [],
        requiredElements: [],
        missingElements: []
      },
      recommendations: ['Adicione mais elementos visuais', 'Inclua exemplos práticos'],
      visualElements: {
        hasCharts: pptxContent.slides.some(s => s.charts > 0),
        hasImages: pptxContent.slides.some(s => s.images > 0),
        hasTables: pptxContent.slides.some(s => s.tables > 0),
        hasInfographics: false,
        visualComplexity: 'medium'
      }
    };
  }

  private getBasicTemplates(): BackendAITemplateRecommendation[] {
    return [
      {
        id: 'safety-basic',
        name: 'Treinamento de Segurança Básico',
        description: 'Template padrão para treinamentos de segurança',
        confidence: 75,
        reasons: ['Template versátil', 'Adequado para conteúdo básico'],
        preview: '/templates/safety-basic.jpg',
        category: 'safety',
        estimatedTime: 15
      },
      {
        id: 'compliance-nr',
        name: 'Conformidade NR',
        description: 'Template focado em normas regulamentadoras',
        confidence: 80,
        reasons: ['Específico para NRs', 'Alta conformidade'],
        preview: '/templates/compliance-nr.jpg',
        category: 'compliance',
        estimatedTime: 20
      }
    ];
  }

  /**
   * Check if backend AI services are available
   */
  isBackendAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status and capabilities
   */
  getServiceStatus() {
    return {
      initialized: this.isInitialized,
      backendUrl: this.apiBaseUrl,
      capabilities: {
        gptVisionAnalysis: this.isInitialized,
        nrComplianceDetection: this.isInitialized,
        templateRecommendations: this.isInitialized,
        contentOptimization: this.isInitialized,
        scriptGeneration: this.isInitialized
      }
    };
  }
}

// Export singleton instance
export const pptxAIIntegrationService = new PPTXAIIntegrationService();
export type { PPTXContent, BackendAITemplateRecommendation, GPTVisionAnalysis };