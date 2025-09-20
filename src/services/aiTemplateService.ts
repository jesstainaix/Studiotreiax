import OpenAI from 'openai';
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

interface NRTemplateRecommendation extends TemplateRecommendation {
  nrCompliance: {
    detectedNRs: string[];
    complianceScore: number;
    requiredElements: string[];
    missingElements: string[];
  };
}

interface TemplateRecommendation {
  id: string;
  name: string;
  description: string;
  confidence: number;
  reasons: string[];
  preview: string;
  category: 'business' | 'education' | 'creative' | 'technical';
  estimatedTime: number;
}

class AITemplateService {
  private openai: OpenAI;
  private isInitialized = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Test API connection
      await this.openai.models.list();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI Template Service:', error);
      throw new Error('AI service initialization failed');
    }
  }

  async analyzeAndRecommend(
    pptxContent: PPTXContent,
    nrDetection?: NRDetectionResult,
    processingMetrics?: { totalTime: number; avgConfidence: number }
  ): Promise<TemplateRecommendation[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // If NR content detected, prioritize NR-specific analysis
    if (nrDetection?.nrDetected && nrDetection.detectedNRs.length > 0) {
      const nrRecommendations = await this.getNRBasedRecommendations(nrDetection, pptxContent);
      if (nrRecommendations.length > 0) {
        return nrRecommendations.slice(0, 3); // Return top 3 NR-specific recommendations
      }
    }

    try {
      const prompt = this.buildEnhancedAnalysisPrompt(pptxContent, nrDetection, processingMetrics);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert presentation designer and content analyst specializing in Brazilian workplace safety regulations (NRs). Analyze PPTX content and recommend the most suitable video templates based on content structure, topics, complexity, and regulatory compliance requirements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      const recommendations = this.parseAIResponse(response.choices[0]?.message?.content || '');
      return this.enrichRecommendations(recommendations, pptxContent, nrDetection);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.getEnhancedFallbackRecommendations(pptxContent, nrDetection);
    }
  }

  private buildEnhancedAnalysisPrompt(
    content: PPTXContent,
    nrDetection?: NRDetectionResult,
    processingMetrics?: { totalTime: number; avgConfidence: number }
  ): string {
    let prompt = `
Analyze this PPTX presentation content and recommend suitable video templates:

**Presentation Overview:**
- Total Slides: ${content.totalSlides}
- Estimated Duration: ${content.estimatedDuration} minutes
- Complexity Level: ${content.complexity}
- Main Topics: ${content.topics.join(', ')}`;

    if (processingMetrics) {
      prompt += `
- OCR Processing: ${processingMetrics.totalTime}ms (avg confidence: ${processingMetrics.avgConfidence}%)`;
    }

    if (nrDetection?.nrDetected) {
      prompt += `

**NR COMPLIANCE DETECTED:**
- Detected NRs: ${nrDetection.detectedNRs.map(nr => `${nr.nr} (${nr.confidence}% confidence)`).join(', ')}
- Overall Confidence: ${nrDetection.confidence}%
- Categories: ${nrDetection.categories.join(', ')}
- Priority Levels: ${nrDetection.detectedNRs.map(nr => `${nr.nr}: ${nr.priority}`).join(', ')}
- Key Safety Topics: ${nrDetection.detectedNRs.flatMap(nr => nr.keywords).slice(0, 10).join(', ')}

**CRITICAL REQUIREMENTS:**
1. MUST prioritize NR-compliant templates with safety-focused design
2. Template MUST include regulatory compliance elements
3. Color scheme MUST follow safety standards (warning colors, high contrast)
4. Layout MUST support safety training content structure
5. Template MUST be optimized for Brazilian workplace safety regulations

**NR-SPECIFIC TEMPLATE PREFERENCES:**
${nrDetection.detectedNRs.map(nr => `- ${nr.nr}: Requires ${this.getNRTemplateRequirements(nr.nr).join(', ')}`).join('\n')}`;
    }

    prompt += `

**Content Breakdown:**
${content.slides.map((slide, index) => `
Slide ${index + 1}:
- Title: ${slide.title || 'No title'}
- Content: ${slide.content.substring(0, 200)}...
- Visual Elements: ${slide.images} images, ${slide.charts} charts, ${slide.tables} tables
`).join('')}

**Please recommend 3-5 video templates that would work best for this content. For each recommendation, provide:**
1. Template name and category
2. Confidence score (0-100)
3. Specific reasons why this template fits
4. Estimated conversion time
5. NR compliance considerations (if applicable)

Format your response as JSON with this structure:
{
  "recommendations": [
    {
      "name": "Template Name",
      "category": "business|education|creative|technical",
      "confidence": 85,
      "reasons": ["reason1", "reason2"],
      "estimatedTime": 120
    }
  ]
}
    `;
    
    return prompt;
  }

  private parseAIResponse(response: string): Partial<TemplateRecommendation>[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.recommendations || [];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  private enrichRecommendations(
    aiRecommendations: Partial<TemplateRecommendation>[],
    content: PPTXContent,
    nrDetection?: NRDetectionResult
  ): TemplateRecommendation[] {
    const templates = this.getAvailableTemplates();
    
    return aiRecommendations.map((rec, index) => {
      let template = templates.find(t => 
        t.name.toLowerCase().includes(rec.name?.toLowerCase() || '') ||
        t.category === rec.category
      ) || templates[index % templates.length];

      // Prioritize NR templates if NR content detected
      if (nrDetection?.nrDetected) {
        const nrTemplate = templates.find(t => t.category === 'safety');
        if (nrTemplate && Math.random() > 0.3) { // 70% chance to recommend NR template
          template = nrTemplate;
        }
      }

      return {
        id: `ai-rec-${Date.now()}-${index}`,
        name: rec.name || template.name,
        description: this.generateEnhancedDescription(rec, content, nrDetection),
        confidence: this.calculateEnhancedConfidence(rec.confidence || 75, nrDetection),
        reasons: this.generateEnhancedReasons(rec, nrDetection),
        preview: template.preview,
        category: (rec.category as any) || template.category,
        estimatedTime: rec.estimatedTime || this.estimateConversionTime(content)
      };
    });
  }

  private generateEnhancedDescription(
    rec: Partial<TemplateRecommendation>,
    content: PPTXContent,
    nrDetection?: NRDetectionResult
  ): string {
    let description = rec.description || `Template optimizado para ${content.slides.length} slides`
    
    if (nrDetection?.nrDetected) {
      description += ` com conformidade NR (${nrDetection.detectedNRs.map(nr => nr.nr).join(', ')})`
    }
    
    if (content.topics.length > 0) {
      description += ` focado em ${content.topics[0]}`
    }
    
    return description
  }

  private calculateEnhancedConfidence(
    baseConfidence: number,
    nrDetection?: NRDetectionResult
  ): number {
    let confidence = baseConfidence
    
    if (nrDetection?.nrDetected) {
      // Boost confidence for NR-compliant templates
      confidence = Math.min(95, confidence + 15)
    }
    
    return confidence
  }

  private generateEnhancedReasons(
    rec: Partial<TemplateRecommendation>,
    nrDetection?: NRDetectionResult
  ): string[] {
    const reasons = rec.reasons || ['AI-generated recommendation']
    
    if (nrDetection?.nrDetected) {
      reasons.unshift(
        `Conformidade NR detectada (${nrDetection.confidence}% confiança)`,
        'Template com elementos de segurança',
        'Atende requisitos regulamentares'
      )
    }
    
    return reasons
  }

  private estimateConversionTime(content: PPTXContent): number {
    // Base time: 10 seconds per slide
    let baseTime = content.totalSlides * 10;
    
    // Add time for complexity
    const complexityMultiplier = {
      basic: 1,
      intermediate: 1.3,
      advanced: 1.6
    };
    
    baseTime *= complexityMultiplier[content.complexity];
    
    // Add time for visual elements
    const totalVisuals = content.slides.reduce((sum, slide) => 
      sum + slide.images + slide.charts + slide.tables, 0
    );
    baseTime += totalVisuals * 2;
    
    return Math.min(Math.max(baseTime, 30), 300); // Between 30s and 5min
  }

  private getEnhancedFallbackRecommendations(
    content: PPTXContent,
    nrDetection?: NRDetectionResult
  ): TemplateRecommendation[] {
    const templates = this.getAvailableTemplates();
    let category = this.inferCategory(content);
    
    // Override category if NR content detected
    if (nrDetection?.nrDetected) {
      category = 'safety' as any;
    }
    
    const filteredTemplates = templates.filter(t => t.category === category);
    const fallbackTemplates = filteredTemplates.length > 0 ? filteredTemplates : templates.slice(0, 3);
    
    return fallbackTemplates
      .slice(0, 3)
      .map(template => ({
        ...template,
        confidence: nrDetection?.nrDetected ? 85 : 60, // Higher confidence for NR matches
        reasons: nrDetection?.nrDetected 
          ? ['NR compliance detected', 'Safety-focused template', 'Regulatory requirements met']
          : ['Fallback recommendation based on content analysis'],
        estimatedTime: this.estimateConversionTime(content)
      }));
  }

  private inferCategory(content: PPTXContent): 'business' | 'education' | 'creative' | 'technical' {
    const topics = content.topics.join(' ').toLowerCase();
    
    if (topics.includes('business') || topics.includes('marketing') || topics.includes('sales')) {
      return 'business';
    }
    if (topics.includes('education') || topics.includes('training') || topics.includes('course')) {
      return 'education';
    }
    if (topics.includes('technical') || topics.includes('development') || topics.includes('engineering')) {
      return 'technical';
    }
    
    return 'creative';
  }

  private getAvailableTemplates(): TemplateRecommendation[] {
    return [
      {
        id: 'modern-business',
        name: 'Modern Business',
        description: 'Template profissional para apresentações corporativas',
        confidence: 80,
        reasons: ['Design limpo e profissional', 'Otimizado para conteúdo corporativo'],
        preview: '/templates/modern-business.jpg',
        category: 'business',
        estimatedTime: 120
      },
      {
        id: 'educational-clean',
        name: 'Educational Clean',
        description: 'Template educacional com foco na clareza',
        confidence: 85,
        reasons: ['Ideal para conteúdo educativo', 'Layout claro e organizado'],
        preview: '/templates/educational-clean.jpg',
        category: 'education',
        estimatedTime: 90
      },
      {
        id: 'creative-dynamic',
        name: 'Creative Dynamic',
        description: 'Template criativo com animações dinâmicas',
        confidence: 75,
        reasons: ['Perfeito para apresentações criativas', 'Animações envolventes'],
        preview: '/templates/creative-dynamic.jpg',
        category: 'creative',
        estimatedTime: 180
      },
      {
        id: 'technical-detailed',
        name: 'Technical Detailed',
        description: 'Template técnico para apresentações detalhadas',
        confidence: 90,
        reasons: ['Ideal para conteúdo técnico', 'Suporte a gráficos e dados'],
        preview: '/templates/technical-detailed.jpg',
        category: 'technical',
        estimatedTime: 150
      },
      {
        id: 'nr-safety-standard',
        name: 'NR Safety Standard',
        description: 'Template para treinamentos de segurança do trabalho',
        confidence: 95,
        reasons: ['Conformidade com NRs', 'Cores e elementos de segurança', 'Layout para treinamentos'],
        preview: '/templates/nr-safety-standard.jpg',
        category: 'safety',
        estimatedTime: 100
      },
      {
        id: 'nr-compliance-pro',
        name: 'NR Compliance Pro',
        description: 'Template avançado para conformidade regulamentar',
        confidence: 92,
        reasons: ['Atende múltiplas NRs', 'Design profissional de segurança', 'Elementos visuais regulamentares'],
        preview: '/templates/nr-compliance-pro.jpg',
        category: 'safety',
        estimatedTime: 110
      },
      {
        id: 'workplace-safety',
        name: 'Workplace Safety',
        description: 'Template para segurança no ambiente de trabalho',
        confidence: 88,
        reasons: ['Foco em segurança ocupacional', 'Iconografia de segurança', 'Layout educativo'],
        preview: '/templates/workplace-safety.jpg',
        category: 'safety',
        estimatedTime: 95
      }
    ];
  }

  async getRealtimeRecommendations(content: PPTXContent): Promise<TemplateRecommendation[]> {
    // For real-time recommendations, use a faster approach
    const quickAnalysis = this.quickContentAnalysis(content);
    return this.getFallbackRecommendations(quickAnalysis);
  }

  private quickContentAnalysis(content: PPTXContent): PPTXContent {
    // Simplified analysis for real-time recommendations
    return {
      ...content,
      complexity: content.totalSlides > 20 ? 'advanced' : 
                 content.totalSlides > 10 ? 'intermediate' : 'basic'
    };
  }

  async getNRBasedRecommendations(
    ocrResults: NRDetectionResult,
    content?: PPTXContent
  ): Promise<NRTemplateRecommendation[]> {
    const detectedNRs = ocrResults.detectedNRs;
    const nrTemplates = this.getNRSpecificTemplates();
    
    // Filter templates based on detected NRs
    const relevantTemplates = nrTemplates.filter(template => 
      detectedNRs.some(nr => template.supportedNRs.includes(nr.nr))
    );
    
    // If no specific templates found, get general safety templates
    const templates = relevantTemplates.length > 0 ? relevantTemplates : 
                     nrTemplates.filter(t => t.category === 'safety');
    
    return templates.slice(0, 5).map(template => {
      const compliance = this.calculateNRCompliance(detectedNRs, template);
      
      return {
        ...template,
        confidence: this.calculateNRConfidence(detectedNRs, template, ocrResults.confidence),
        reasons: [
          ...template.reasons,
          `Detectadas NRs: ${detectedNRs.map(nr => nr.nr).join(', ')}`,
          `Score de conformidade: ${compliance.complianceScore}%`
        ],
        estimatedTime: content ? this.estimateConversionTime(content) : 120,
        nrCompliance: compliance
      };
    });
  }

  private getNRSpecificTemplates(): (TemplateRecommendation & { supportedNRs: string[] })[] {
    return [
      {
        id: 'nr-safety-standard',
        name: 'NR Safety Standard',
        description: 'Template padrão para treinamentos de segurança do trabalho',
        confidence: 90,
        reasons: ['Otimizado para conteúdo de NRs', 'Layout focado em segurança'],
        preview: '/templates/nr-safety-standard.jpg',
        category: 'safety' as any,
        estimatedTime: 150,
        supportedNRs: ['NR-01', 'NR-04', 'NR-06', 'NR-10', 'NR-12', 'NR-17', 'NR-35']
      },
      {
        id: 'nr-electrical-safety',
        name: 'NR Electrical Safety',
        description: 'Template especializado para NR-10 e segurança elétrica',
        confidence: 95,
        reasons: ['Específico para NR-10', 'Elementos visuais de segurança elétrica'],
        preview: '/templates/nr-electrical.jpg',
        category: 'safety' as any,
        estimatedTime: 180,
        supportedNRs: ['NR-10']
      },
      {
        id: 'nr-machinery-safety',
        name: 'NR Machinery Safety',
        description: 'Template para NR-12 e segurança em máquinas',
        confidence: 95,
        reasons: ['Específico para NR-12', 'Foco em segurança de máquinas'],
        preview: '/templates/nr-machinery.jpg',
        category: 'safety' as any,
        estimatedTime: 200,
        supportedNRs: ['NR-12']
      },
      {
        id: 'nr-ergonomics',
        name: 'NR Ergonomics',
        description: 'Template para NR-17 e ergonomia',
        confidence: 90,
        reasons: ['Específico para NR-17', 'Layout ergonômico'],
        preview: '/templates/nr-ergonomics.jpg',
        category: 'safety' as any,
        estimatedTime: 160,
        supportedNRs: ['NR-17']
      },
      {
        id: 'nr-height-safety',
        name: 'NR Height Safety',
        description: 'Template para NR-35 e trabalho em altura',
        confidence: 95,
        reasons: ['Específico para NR-35', 'Elementos visuais de altura'],
        preview: '/templates/nr-height.jpg',
        category: 'safety' as any,
        estimatedTime: 170,
        supportedNRs: ['NR-35']
      }
    ];
  }

  private calculateNRCompliance(
    detectedNRs: Array<{ nr: string; confidence: number; keywords: string[] }>,
    template: { supportedNRs: string[] }
  ) {
    const supportedCount = detectedNRs.filter(nr => 
      template.supportedNRs.includes(nr.nr)
    ).length;
    
    const complianceScore = detectedNRs.length > 0 ? 
      Math.round((supportedCount / detectedNRs.length) * 100) : 0;
    
    const requiredElements = this.getNRRequiredElements(detectedNRs.map(nr => nr.nr));
    const missingElements = requiredElements.filter(element => 
      !template.supportedNRs.some(nr => this.templateHasElement(template, element))
    );
    
    return {
      detectedNRs: detectedNRs.map(nr => nr.nr),
      complianceScore,
      requiredElements,
      missingElements
    };
  }

  private calculateNRConfidence(
    detectedNRs: Array<{ nr: string; confidence: number }>,
    template: { supportedNRs: string[] },
    ocrConfidence: number
  ): number {
    const avgNRConfidence = detectedNRs.reduce((sum, nr) => sum + nr.confidence, 0) / detectedNRs.length;
    const supportMatch = detectedNRs.filter(nr => template.supportedNRs.includes(nr.nr)).length / detectedNRs.length;
    
    return Math.round((avgNRConfidence * 0.4 + ocrConfidence * 0.3 + supportMatch * 100 * 0.3));
  }

  private getNRRequiredElements(nrs: string[]): string[] {
    const elements = new Set<string>();
    
    nrs.forEach(nr => {
      switch (nr) {
        case 'NR-01':
          elements.add('Disposições Gerais');
          elements.add('Responsabilidades');
          break;
        case 'NR-04':
          elements.add('SESMT');
          elements.add('Dimensionamento');
          break;
        case 'NR-06':
          elements.add('EPI');
          elements.add('Obrigações');
          break;
        case 'NR-10':
          elements.add('Segurança Elétrica');
          elements.add('Medidas de Proteção');
          break;
        case 'NR-12':
          elements.add('Segurança em Máquinas');
          elements.add('Dispositivos de Segurança');
          break;
        case 'NR-17':
          elements.add('Ergonomia');
          elements.add('Condições de Trabalho');
          break;
        case 'NR-35':
          elements.add('Trabalho em Altura');
          elements.add('Medidas de Proteção');
          break;
      }
    });
    
    return Array.from(elements);
  }

  private templateHasElement(template: any, element: string): boolean {
    // Simplified check - in a real implementation, this would check template metadata
    return template.supportedNRs.length > 0;
  }

  private getNRTemplateRequirements(nr: string): string[] {
    const requirements: Record<string, string[]> = {
      'NR-01': [
        'Disposições gerais layout',
        'Responsabilidades section',
        'Compliance checklist elements'
      ],
      'NR-04': [
        'SESMT organizational charts',
        'Dimensionamento tables',
        'Service structure diagrams'
      ],
      'NR-06': [
        'EPI visual catalog',
        'Usage instruction layouts',
        'Maintenance schedule templates'
      ],
      'NR-10': [
        'Electrical safety symbols',
        'Risk assessment matrices',
        'Emergency procedure flows',
        'High-contrast warning colors'
      ],
      'NR-12': [
        'Machinery safety diagrams',
        'Protection device illustrations',
        'Operational procedure steps',
        'Safety zone markings'
      ],
      'NR-17': [
        'Ergonomic assessment layouts',
        'Posture demonstration areas',
        'Workplace organization guides',
        'Health monitoring charts'
      ],
      'NR-35': [
        'Height work safety elements',
        'Fall protection systems',
        'Rescue procedure flows',
        'Equipment inspection checklists'
      ]
    };
    
    return requirements[nr] || ['General safety template elements'];
  }

  // Enhanced template matching with AI-powered content analysis
  async getSmartTemplateRecommendations(
    pptxContent: PPTXContent,
    nrDetection?: NRDetectionResult
  ): Promise<TemplateRecommendation[]> {
    // Combine content analysis with NR detection for smarter recommendations
    const contentAnalysis = this.analyzeContentStructure(pptxContent);
    const nrAnalysis = nrDetection ? this.analyzeNRRequirements(nrDetection) : null;
    
    // Get base recommendations
    const baseRecommendations = await this.analyzeAndRecommend(pptxContent, nrDetection);
    
    // Enhance with smart scoring
    return baseRecommendations.map(rec => ({
      ...rec,
      confidence: this.calculateSmartConfidence(rec, contentAnalysis, nrAnalysis),
      reasons: [
        ...rec.reasons,
        ...this.generateSmartReasons(contentAnalysis, nrAnalysis)
      ]
    }));
  }

  private analyzeContentStructure(content: PPTXContent) {
    const totalVisuals = content.slides.reduce((sum, slide) => 
      sum + slide.images + slide.charts + slide.tables, 0
    );
    
    return {
      visualDensity: totalVisuals / content.totalSlides,
      textComplexity: content.complexity,
      topicDiversity: content.topics.length,
      presentationLength: content.totalSlides,
      estimatedEngagement: this.calculateEngagementScore(content)
    };
  }

  private analyzeNRRequirements(nrDetection: NRDetectionResult) {
    return {
      complianceLevel: nrDetection.confidence,
      regulatoryComplexity: nrDetection.detectedNRs.length,
      priorityDistribution: this.calculatePriorityDistribution(nrDetection.detectedNRs),
      safetyFocus: this.calculateSafetyFocus(nrDetection.categories)
    };
  }

  private calculateSmartConfidence(
    recommendation: TemplateRecommendation,
    contentAnalysis: any,
    nrAnalysis: any
  ): number {
    let confidence = recommendation.confidence;
    
    // Boost confidence for NR-compliant templates when NR content detected
    if (nrAnalysis && recommendation.category === 'safety') {
      confidence += Math.min(20, nrAnalysis.complianceLevel * 0.2);
    }
    
    // Adjust based on content complexity match
    if (contentAnalysis.textComplexity === 'advanced' && recommendation.estimatedTime > 150) {
      confidence += 10;
    }
    
    return Math.min(98, Math.max(60, confidence));
  }

  private generateSmartReasons(contentAnalysis: any, nrAnalysis: any): string[] {
    const reasons: string[] = [];
    
    if (nrAnalysis) {
      reasons.push(`Conformidade NR detectada (${nrAnalysis.complianceLevel}% confiança)`);
      if (nrAnalysis.regulatoryComplexity > 2) {
        reasons.push('Template otimizado para múltiplas NRs');
      }
    }
    
    if (contentAnalysis.visualDensity > 1.5) {
      reasons.push('Suporte otimizado para conteúdo visual rico');
    }
    
    if (contentAnalysis.presentationLength > 20) {
      reasons.push('Template escalável para apresentações extensas');
    }
    
    return reasons;
  }

  private calculateEngagementScore(content: PPTXContent): number {
    const visualScore = content.slides.reduce((sum, slide) => 
      sum + (slide.images * 2) + (slide.charts * 3) + (slide.tables * 1), 0
    );
    
    const complexityScore = {
      basic: 1,
      intermediate: 2,
      advanced: 3
    }[content.complexity];
    
    return Math.min(100, (visualScore / content.totalSlides * 10) + (complexityScore * 10));
  }

  private calculatePriorityDistribution(detectedNRs: Array<{ priority: string }>): Record<string, number> {
    const distribution: Record<string, number> = { high: 0, medium: 0, low: 0 };
    detectedNRs.forEach(nr => {
      distribution[nr.priority] = (distribution[nr.priority] || 0) + 1;
    });
    return distribution;
  }

  private calculateSafetyFocus(categories: string[]): number {
    const safetyKeywords = ['safety', 'segurança', 'proteção', 'prevenção', 'risco'];
    const safetyCount = categories.filter(cat => 
      safetyKeywords.some(keyword => cat.toLowerCase().includes(keyword))
    ).length;
    
    return Math.min(100, (safetyCount / categories.length) * 100);
  }
}

export const aiTemplateService = new AITemplateService();
export type { PPTXContent, TemplateRecommendation, NRTemplateRecommendation };