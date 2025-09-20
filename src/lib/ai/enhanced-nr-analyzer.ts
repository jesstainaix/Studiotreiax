/**
 * Enhanced NR Analyzer with Advanced AI Detection
 * Sistema inteligente para detecção de Normas Regulamentadoras e sugestões de templates
 */

import type { PPTXSlide, PPTXProject } from '../pptx/content-extractor';

export interface NRDetectionResult {
  nrNumber: string;
  nrTitle: string;
  confidence: number;
  detectedKeywords: string[];
  relevantSlides: number[];
  complianceLevel: 'full' | 'partial' | 'none';
  recommendations: string[];
}

export interface TemplateRecommendation {
  id: string;
  name: string;
  description: string;
  suitabilityScore: number;
  nrCompliance: string[];
  features: string[];
  previewUrl?: string;
  estimatedDuration: number;
}

export interface EnhancedAIAnalysis {
  detectedNRs: NRDetectionResult[];
  templateRecommendations: TemplateRecommendation[];
  contentInsights: {
    primaryTopic: string;
    secondaryTopics: string[];
    complexity: 'basic' | 'intermediate' | 'advanced';
    targetAudience: string;
    estimatedReadingTime: number;
    keyPoints: string[];
    safetyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  optimizationSuggestions: {
    slideStructure: string[];
    contentFlow: string[];
    visualEnhancements: string[];
    accessibilityImprovements: string[];
  };
}

interface NRDatabase {
  [key: string]: {
    title: string;
    keywords: string[];
    requiredElements: string[];
    templates: string[];
    safetyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class EnhancedNRAnalyzer {
  private nrDatabase: NRDatabase = {
    'NR-01': {
      title: 'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
      keywords: ['risco', 'segurança', 'saúde', 'trabalho', 'prevenção', 'acidente', 'GRO', 'PGR'],
      requiredElements: ['identificação de riscos', 'medidas preventivas', 'treinamento'],
      templates: ['safety-overview', 'risk-management', 'general-safety'],
      safetyLevel: 'high'
    },
    'NR-05': {
      title: 'Comissão Interna de Prevenção de Acidentes',
      keywords: ['CIPA', 'comissão', 'prevenção', 'acidentes', 'representante', 'eleição'],
      requiredElements: ['composição da CIPA', 'atribuições', 'funcionamento'],
      templates: ['cipa-training', 'committee-structure', 'prevention-focus'],
      safetyLevel: 'medium'
    },
    'NR-06': {
      title: 'Equipamento de Proteção Individual',
      keywords: ['EPI', 'equipamento', 'proteção', 'individual', 'capacete', 'luva', 'óculos'],
      requiredElements: ['tipos de EPI', 'uso correto', 'manutenção', 'treinamento'],
      templates: ['epi-training', 'equipment-focus', 'protection-guide'],
      safetyLevel: 'critical'
    },
    'NR-10': {
      title: 'Segurança em Instalações e Serviços em Eletricidade',
      keywords: ['elétrico', 'eletricidade', 'instalação', 'choque', 'alta tensão', 'baixa tensão'],
      requiredElements: ['riscos elétricos', 'medidas de controle', 'procedimentos seguros'],
      templates: ['electrical-safety', 'technical-detailed', 'hazard-focus'],
      safetyLevel: 'critical'
    },
    'NR-12': {
      title: 'Segurança no Trabalho em Máquinas e Equipamentos',
      keywords: ['máquina', 'equipamento', 'proteção', 'dispositivo', 'operação', 'manutenção'],
      requiredElements: ['dispositivos de segurança', 'procedimentos operacionais', 'capacitação'],
      templates: ['machinery-safety', 'operational-focus', 'technical-detailed'],
      safetyLevel: 'critical'
    },
    'NR-17': {
      title: 'Ergonomia',
      keywords: ['ergonomia', 'postura', 'levantamento', 'transporte', 'mobiliário', 'ambiente'],
      requiredElements: ['análise ergonômica', 'condições de trabalho', 'organização do trabalho'],
      templates: ['ergonomics-focus', 'workplace-wellness', 'health-oriented'],
      safetyLevel: 'medium'
    },
    'NR-18': {
      title: 'Condições e Meio Ambiente de Trabalho na Indústria da Construção',
      keywords: ['construção', 'obra', 'canteiro', 'andaime', 'escavação', 'demolição'],
      requiredElements: ['PCMAT', 'medidas de proteção coletiva', 'treinamento específico'],
      templates: ['construction-safety', 'industrial-focus', 'site-specific'],
      safetyLevel: 'critical'
    },
    'NR-23': {
      title: 'Proteção Contra Incêndios',
      keywords: ['incêndio', 'fogo', 'extintor', 'evacuação', 'emergência', 'brigada'],
      requiredElements: ['prevenção de incêndios', 'combate ao fogo', 'plano de evacuação'],
      templates: ['fire-safety', 'emergency-response', 'prevention-focus'],
      safetyLevel: 'high'
    },
    'NR-33': {
      title: 'Segurança e Saúde nos Trabalhos em Espaços Confinados',
      keywords: ['espaço confinado', 'atmosfera', 'ventilação', 'monitoramento', 'resgate'],
      requiredElements: ['identificação de espaços confinados', 'procedimentos de entrada', 'supervisão'],
      templates: ['confined-space', 'specialized-safety', 'technical-detailed'],
      safetyLevel: 'critical'
    },
    'NR-35': {
      title: 'Trabalho em Altura',
      keywords: ['altura', 'queda', 'cinto', 'andaime', 'escada', 'plataforma'],
      requiredElements: ['análise de risco', 'sistemas de proteção', 'capacitação específica'],
      templates: ['height-safety', 'fall-protection', 'specialized-safety'],
      safetyLevel: 'critical'
    }
  };

  private templateDatabase: TemplateRecommendation[] = [
    {
      id: 'safety-overview',
      name: 'Visão Geral de Segurança',
      description: 'Template abrangente para apresentações gerais de segurança do trabalho',
      suitabilityScore: 0,
      nrCompliance: ['NR-01', 'NR-05'],
      features: ['Introdução clara', 'Conceitos fundamentais', 'Casos práticos'],
      estimatedDuration: 1800 // 30 minutos
    },
    {
      id: 'epi-training',
      name: 'Treinamento de EPI',
      description: 'Focado em equipamentos de proteção individual com demonstrações visuais',
      suitabilityScore: 0,
      nrCompliance: ['NR-06'],
      features: ['Demonstrações visuais', 'Casos de uso', 'Manutenção de equipamentos'],
      estimatedDuration: 1200 // 20 minutos
    },
    {
      id: 'electrical-safety',
      name: 'Segurança Elétrica',
      description: 'Template técnico para treinamentos de segurança em eletricidade',
      suitabilityScore: 0,
      nrCompliance: ['NR-10'],
      features: ['Diagramas técnicos', 'Procedimentos detalhados', 'Casos de emergência'],
      estimatedDuration: 2400 // 40 minutos
    },
    {
      id: 'machinery-safety',
      name: 'Segurança em Máquinas',
      description: 'Focado em operação segura de máquinas e equipamentos',
      suitabilityScore: 0,
      nrCompliance: ['NR-12'],
      features: ['Procedimentos operacionais', 'Dispositivos de segurança', 'Manutenção preventiva'],
      estimatedDuration: 2100 // 35 minutos
    },
    {
      id: 'height-safety',
      name: 'Trabalho em Altura',
      description: 'Especializado em prevenção de quedas e trabalho seguro em altura',
      suitabilityScore: 0,
      nrCompliance: ['NR-35'],
      features: ['Sistemas de proteção', 'Equipamentos específicos', 'Procedimentos de resgate'],
      estimatedDuration: 1800 // 30 minutos
    },
    {
      id: 'fire-safety',
      name: 'Prevenção e Combate a Incêndios',
      description: 'Aborda prevenção, combate e evacuação em casos de incêndio',
      suitabilityScore: 0,
      nrCompliance: ['NR-23'],
      features: ['Prevenção de incêndios', 'Uso de extintores', 'Planos de evacuação'],
      estimatedDuration: 1500 // 25 minutos
    }
  ];

  /**
   * Analyze PPTX content for NR compliance and generate recommendations
   */
  async analyzeContent(project: PPTXProject): Promise<EnhancedAIAnalysis> {
    const startTime = performance.now();
    
    // Extract all text content for analysis
    const allText = this.extractAllText(project.slides);
    
    // Detect NRs with confidence scoring
    const detectedNRs = await this.detectNRs(allText, project.slides);
    
    // Generate template recommendations based on detected NRs
    const templateRecommendations = this.generateTemplateRecommendations(detectedNRs, project);
    
    // Analyze content insights
    const contentInsights = this.analyzeContentInsights(allText, detectedNRs);
    
    // Generate optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(project, detectedNRs);
    
    return {
      detectedNRs,
      templateRecommendations,
      contentInsights,
      optimizationSuggestions
    };
  }

  /**
   * Detect NRs in content with advanced keyword matching and context analysis
   */
  private async detectNRs(text: string, slides: PPTXSlide[]): Promise<NRDetectionResult[]> {
    const detectedNRs: NRDetectionResult[] = [];
    const normalizedText = text.toLowerCase();
    
    for (const [nrNumber, nrData] of Object.entries(this.nrDatabase)) {
      const detectedKeywords: string[] = [];
      let totalScore = 0;
      
      // Check for keyword matches with context weighting
      for (const keyword of nrData.keywords) {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        const matches = normalizedText.match(regex);
        
        if (matches) {
          detectedKeywords.push(keyword);
          // Weight score based on keyword importance and frequency
          const keywordScore = this.calculateKeywordScore(keyword, matches.length, nrData.keywords.length);
          totalScore += keywordScore;
        }
      }
      
      // Calculate confidence based on keyword coverage and context
      const keywordCoverage = detectedKeywords.length / nrData.keywords.length;
      const confidence = Math.min(totalScore * keywordCoverage, 1.0);
      
      // Only include NRs with reasonable confidence
      if (confidence > 0.3) {
        const relevantSlides = this.findRelevantSlides(slides, detectedKeywords);
        const complianceLevel = this.assessComplianceLevel(confidence, detectedKeywords, nrData.requiredElements);
        
        detectedNRs.push({
          nrNumber,
          nrTitle: nrData.title,
          confidence: Math.round(confidence * 100) / 100,
          detectedKeywords,
          relevantSlides,
          complianceLevel,
          recommendations: this.generateNRRecommendations(nrNumber, complianceLevel, nrData)
        });
      }
    }
    
    // Sort by confidence
    return detectedNRs.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate template recommendations based on detected NRs
   */
  private generateTemplateRecommendations(detectedNRs: NRDetectionResult[], project: PPTXProject): TemplateRecommendation[] {
    const recommendations: TemplateRecommendation[] = [];
    
    for (const template of this.templateDatabase) {
      let suitabilityScore = 0;
      
      // Calculate suitability based on NR matches
      for (const detectedNR of detectedNRs) {
        if (template.nrCompliance.includes(detectedNR.nrNumber)) {
          suitabilityScore += detectedNR.confidence * 0.8;
        }
      }
      
      // Adjust score based on content complexity and slide count
      const complexityBonus = this.calculateComplexityBonus(project, template);
      suitabilityScore += complexityBonus;
      
      // Only recommend templates with reasonable suitability
      if (suitabilityScore > 0.4) {
        recommendations.push({
          ...template,
          suitabilityScore: Math.round(suitabilityScore * 100) / 100
        });
      }
    }
    
    // Sort by suitability score
    return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore).slice(0, 3);
  }

  /**
   * Analyze content insights for better understanding
   */
  private analyzeContentInsights(text: string, detectedNRs: NRDetectionResult[]) {
    const words = text.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(words / 200); // 200 words per minute
    
    // Determine primary topic based on highest confidence NR
    const primaryNR = detectedNRs[0];
    const primaryTopic = primaryNR ? primaryNR.nrTitle : 'Segurança do Trabalho';
    
    // Extract secondary topics
    const secondaryTopics = detectedNRs.slice(1, 3).map(nr => nr.nrTitle);
    
    // Determine complexity based on technical terms and NR coverage
    const complexity = this.determineComplexity(text, detectedNRs);
    
    // Determine safety level based on detected NRs
    const safetyLevel = this.determineSafetyLevel(detectedNRs);
    
    // Extract key points from high-confidence NRs
    const keyPoints = detectedNRs
      .filter(nr => nr.confidence > 0.6)
      .map(nr => `${nr.nrNumber}: ${nr.nrTitle}`)
      .slice(0, 5);
    
    return {
      primaryTopic,
      secondaryTopics,
      complexity,
      targetAudience: 'Trabalhadores e supervisores',
      estimatedReadingTime,
      keyPoints,
      safetyLevel
    };
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(project: PPTXProject, detectedNRs: NRDetectionResult[]) {
    const suggestions = {
      slideStructure: [] as string[],
      contentFlow: [] as string[],
      visualEnhancements: [] as string[],
      accessibilityImprovements: [] as string[]
    };
    
    // Slide structure suggestions
    if (project.slides.length > 20) {
      suggestions.slideStructure.push('Considere dividir em módulos menores para melhor absorção');
    }
    
    if (!project.slides.some(slide => slide.layout === 'title')) {
      suggestions.slideStructure.push('Adicione um slide de título para melhor apresentação');
    }
    
    // Content flow suggestions
    if (detectedNRs.length > 1) {
      suggestions.contentFlow.push('Organize o conteúdo por NR para melhor estruturação');
      suggestions.contentFlow.push('Adicione slides de transição entre diferentes tópicos');
    }
    
    // Visual enhancements
    suggestions.visualEnhancements.push('Inclua diagramas e infográficos para conceitos complexos');
    suggestions.visualEnhancements.push('Use cores consistentes com a identidade de segurança');
    
    // Accessibility improvements
    suggestions.accessibilityImprovements.push('Garanta contraste adequado para leitura');
    suggestions.accessibilityImprovements.push('Use fontes legíveis e tamanho adequado');
    
    return suggestions;
  }

  // Helper methods
  private extractAllText(slides: PPTXSlide[]): string {
    return slides.map(slide => `${slide.title || ''} ${slide.content || ''}`).join(' ');
  }

  private calculateKeywordScore(keyword: string, frequency: number, totalKeywords: number): number {
    const baseScore = 1 / totalKeywords;
    const frequencyBonus = Math.min(frequency * 0.1, 0.3);
    return baseScore + frequencyBonus;
  }

  private findRelevantSlides(slides: PPTXSlide[], keywords: string[]): number[] {
    const relevantSlides: number[] = [];
    
    slides.forEach((slide, index) => {
      const slideText = `${slide.title || ''} ${slide.content || ''}`.toLowerCase();
      const hasKeyword = keywords.some(keyword => 
        slideText.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        relevantSlides.push(index + 1);
      }
    });
    
    return relevantSlides;
  }

  private assessComplianceLevel(confidence: number, keywords: string[], requiredElements: string[]): 'full' | 'partial' | 'none' {
    if (confidence > 0.8 && keywords.length >= requiredElements.length * 0.8) {
      return 'full';
    } else if (confidence > 0.5) {
      return 'partial';
    }
    return 'none';
  }

  private generateNRRecommendations(nrNumber: string, complianceLevel: string, nrData: any): string[] {
    const recommendations: string[] = [];
    
    if (complianceLevel === 'partial') {
      recommendations.push(`Inclua mais elementos específicos da ${nrNumber}`);
      recommendations.push('Adicione exemplos práticos e casos reais');
    } else if (complianceLevel === 'none') {
      recommendations.push(`Revise o conteúdo para melhor aderência à ${nrNumber}`);
      recommendations.push('Consulte a norma oficial para elementos obrigatórios');
    }
    
    recommendations.push(`Considere usar templates específicos para ${nrNumber}`);
    
    return recommendations;
  }

  private calculateComplexityBonus(project: PPTXProject, template: TemplateRecommendation): number {
    let bonus = 0;
    
    // Slide count compatibility
    const idealSlideCount = template.estimatedDuration / 60; // 1 minute per slide average
    const slideCountDiff = Math.abs(project.slides.length - idealSlideCount);
    bonus += Math.max(0, 0.2 - (slideCountDiff * 0.02));
    
    return bonus;
  }

  private determineComplexity(text: string, detectedNRs: NRDetectionResult[]): 'basic' | 'intermediate' | 'advanced' {
    const technicalTerms = ['procedimento', 'dispositivo', 'sistema', 'análise', 'monitoramento'];
    const technicalCount = technicalTerms.filter(term => 
      text.toLowerCase().includes(term)
    ).length;
    
    if (detectedNRs.length > 2 && technicalCount > 3) {
      return 'advanced';
    } else if (detectedNRs.length > 1 || technicalCount > 1) {
      return 'intermediate';
    }
    return 'basic';
  }

  private determineSafetyLevel(detectedNRs: NRDetectionResult[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalNRs = ['NR-06', 'NR-10', 'NR-12', 'NR-18', 'NR-33', 'NR-35'];
    const highNRs = ['NR-01', 'NR-23'];
    
    const hasCritical = detectedNRs.some(nr => criticalNRs.includes(nr.nrNumber));
    const hasHigh = detectedNRs.some(nr => highNRs.includes(nr.nrNumber));
    
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (detectedNRs.length > 0) return 'medium';
    return 'low';
  }
}

// Export singleton instance
export const enhancedNRAnalyzer = new EnhancedNRAnalyzer();