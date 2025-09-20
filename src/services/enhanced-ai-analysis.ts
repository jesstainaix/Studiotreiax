// Sistema Melhorado de Análise de Conteúdo com IA
import { EventEmitter } from '../utils/EventEmitter';
import { pptxCacheService } from './pptx-cache-service';
import CryptoJS from 'crypto-js';

// Browser-compatible hash function
const createHash = (algorithm: string) => ({
  update: (data: string | Buffer) => ({
    digest: (encoding: string) => {
      const dataStr = typeof data === 'string' ? data : data.toString();
      return CryptoJS.MD5(dataStr).toString();
    }
  })
});

export interface AIAnalysisConfig {
  enableGPTVision: boolean;
  enableNRCompliance: boolean;
  enableSentimentAnalysis: boolean;
  enableTopicExtraction: boolean;
  enableQualityAssessment: boolean;
  confidenceThreshold: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface ContentAnalysis {
  overview: {
    totalSlides: number;
    estimatedDuration: number;
    complexity: 'basic' | 'intermediate' | 'advanced';
    readabilityScore: number;
    engagementScore: number;
  };
  topics: TopicAnalysis[];
  sentiment: SentimentAnalysis;
  nrCompliance: NRComplianceAnalysis;
  qualityMetrics: QualityMetrics;
  recommendations: Recommendation[];
  visualElements: VisualElementAnalysis[];
}

export interface TopicAnalysis {
  name: string;
  confidence: number;
  category: 'safety' | 'training' | 'compliance' | 'technical' | 'general';
  keywords: string[];
  relevanceScore: number;
  slideReferences: number[];
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotions: {
    professional: number;
    educational: number;
    urgent: number;
    informative: number;
  };
  tone: 'formal' | 'casual' | 'technical' | 'instructional';
}

export interface NRComplianceAnalysis {
  overallScore: number;
  detectedNRs: DetectedNR[];
  complianceLevel: 'high' | 'medium' | 'low';
  missingElements: string[];
  recommendations: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

export interface DetectedNR {
  number: string;
  title: string;
  confidence: number;
  matchedKeywords: string[];
  relevantSlides: number[];
  complianceScore: number;
  requiredElements: string[];
  presentElements: string[];
}

export interface QualityMetrics {
  contentQuality: number;
  structureQuality: number;
  visualQuality: number;
  accessibilityScore: number;
  consistencyScore: number;
  completenessScore: number;
}

export interface Recommendation {
  type: 'content' | 'structure' | 'visual' | 'compliance' | 'engagement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  slideReferences?: number[];
}

export interface VisualElementAnalysis {
  type: 'image' | 'chart' | 'table' | 'diagram' | 'text';
  slideIndex: number;
  importance: number;
  quality: number;
  suggestedEnhancements: string[];
  accessibilityIssues: string[];
}

class EnhancedAIAnalysis extends EventEmitter {
  private config: AIAnalysisConfig;
  private nrDatabase: Map<string, any>;

  constructor(config: Partial<AIAnalysisConfig> = {}) {
    super();
    
    this.config = {
      enableGPTVision: true,
      enableNRCompliance: true,
      enableSentimentAnalysis: true,
      enableTopicExtraction: true,
      enableQualityAssessment: true,
      confidenceThreshold: 0.7,
      maxRetries: 3,
      timeoutMs: 30000,
      ...config
    };

    this.nrDatabase = new Map();
    this.initializeModels();
  }

  async analyzeContent(
    pptxContent: any,
    options: {
      includeVisualAnalysis?: boolean;
      includeDeepLearning?: boolean;
      customNRs?: string[];
    } = {}
  ): Promise<ContentAnalysis> {
    const contentHash = this.createContentHash(pptxContent);
    
    // Verificar cache primeiro
    const cached = await pptxCacheService.getAnalysis(`enhanced-ai:${contentHash}`);
    if (cached) {
      this.emit('analysisCacheHit', { contentHash });
      return cached;
    }

    this.emit('analysisStart', { contentHash, slides: pptxContent.slides?.length || 0 });

    try {
      const analysis: ContentAnalysis = {
        overview: await this.analyzeOverview(pptxContent),
        topics: await this.extractTopics(pptxContent),
        sentiment: await this.analyzeSentiment(pptxContent),
        nrCompliance: await this.analyzeNRCompliance(pptxContent, options.customNRs),
        qualityMetrics: await this.assessQuality(pptxContent),
        recommendations: [],
        visualElements: options.includeVisualAnalysis ? 
          await this.analyzeVisualElements(pptxContent) : []
      };

      // Gerar recomendações baseadas na análise
      analysis.recommendations = await this.generateRecommendations(analysis);

      // Cache do resultado
      await pptxCacheService.cacheAnalysis(`enhanced-ai:${contentHash}`, analysis);

      this.emit('analysisComplete', { 
        contentHash, 
        duration: Date.now(),
        topicsFound: analysis.topics.length,
        complianceScore: analysis.nrCompliance.overallScore
      });

      return analysis;

    } catch (error: any) {
      this.emit('analysisError', { contentHash, error: error.message });
      throw error;
    }
  }

  private async analyzeOverview(content: any): Promise<ContentAnalysis['overview']> {
    const slides = content.slides || [];
    const totalWords = slides.reduce((sum: number, slide: any) => 
      sum + (slide.content?.split(' ').length || 0), 0);

    // Calcular complexidade baseada em múltiplos fatores
    const complexity = this.calculateComplexity(slides, totalWords);
    
    // Calcular legibilidade usando algoritmo Flesch
    const readabilityScore = this.calculateReadability(slides);
    
    // Calcular engajamento baseado em elementos visuais e interativos
    const engagementScore = this.calculateEngagement(slides);

    return {
      totalSlides: slides.length,
      estimatedDuration: this.estimateDuration(slides),
      complexity,
      readabilityScore,
      engagementScore
    };
  }

  private async extractTopics(content: any): Promise<TopicAnalysis[]> {
    const slides = content.slides || [];
    const allText = slides.map((s: any) => s.content || '').join(' ').toLowerCase();
    
    const topics: TopicAnalysis[] = [];

    // Análise de tópicos de segurança
    const safetyKeywords = ['segurança', 'proteção', 'risco', 'acidente', 'prevenção', 'epi'];
    const safetyMatches = safetyKeywords.filter(keyword => allText.includes(keyword));
    
    if (safetyMatches.length > 0) {
      topics.push({
        name: 'Segurança no Trabalho',
        confidence: safetyMatches.length / safetyKeywords.length,
        category: 'safety',
        keywords: safetyMatches,
        relevanceScore: safetyMatches.length * 20,
        slideReferences: []
      });
    }

    // Análise de tópicos técnicos
    const technicalKeywords = ['equipamento', 'máquina', 'procedimento', 'operação', 'manutenção'];
    const technicalMatches = technicalKeywords.filter(keyword => allText.includes(keyword));
    
    if (technicalMatches.length > 0) {
      topics.push({
        name: 'Aspectos Técnicos',
        confidence: technicalMatches.length / technicalKeywords.length,
        category: 'technical',
        keywords: technicalMatches,
        relevanceScore: technicalMatches.length * 15,
        slideReferences: []
      });
    }

    // Análise de tópicos de treinamento
    const trainingKeywords = ['treinamento', 'capacitação', 'aprendizado', 'curso', 'instrução'];
    const trainingMatches = trainingKeywords.filter(keyword => allText.includes(keyword));
    
    if (trainingMatches.length > 0) {
      topics.push({
        name: 'Treinamento e Capacitação',
        confidence: trainingMatches.length / trainingKeywords.length,
        category: 'training',
        keywords: trainingMatches,
        relevanceScore: trainingMatches.length * 18,
        slideReferences: []
      });
    }

    return topics.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async analyzeSentiment(content: any): Promise<SentimentAnalysis> {
    const slides = content.slides || [];
    const allText = slides.map((s: any) => s.content || '').join(' ').toLowerCase();

    // Análise de sentimento usando palavras-chave
    const positiveWords = ['seguro', 'eficiente', 'qualidade', 'melhoria', 'sucesso'];
    const negativeWords = ['risco', 'perigo', 'acidente', 'falha', 'problema'];
    const professionalWords = ['norma', 'procedimento', 'regulamento', 'padrão', 'compliance'];

    const positiveCount = positiveWords.filter(word => allText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => allText.includes(word)).length;
    const professionalCount = professionalWords.filter(word => allText.includes(word)).length;

    const overallScore = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);

    return {
      overall: overallScore > 0.1 ? 'positive' : overallScore < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(overallScore),
      emotions: {
        professional: Math.min(professionalCount / 5, 1),
        educational: 0.7,
        urgent: negativeCount > 2 ? 0.8 : 0.3,
        informative: 0.9
      },
      tone: professionalCount > 2 ? 'formal' : 'instructional'
    };
  }

  private async analyzeNRCompliance(content: any, customNRs?: string[]): Promise<NRComplianceAnalysis> {
    const slides = content.slides || [];
    const allText = slides.map((s: any) => s.content || '').join(' ').toLowerCase();

    const nrsToCheck = customNRs || ['NR-06', 'NR-10', 'NR-12', 'NR-17', 'NR-23', 'NR-35'];
    const detectedNRs: DetectedNR[] = [];
    let totalScore = 0;

    for (const nrNumber of nrsToCheck) {
      const nrData = this.nrDatabase.get(nrNumber);
      if (!nrData) continue;

      const matchedKeywords = nrData.keywords.filter((keyword: string) => 
        allText.includes(keyword.toLowerCase()));

      if (matchedKeywords.length > 0) {
        const confidence = matchedKeywords.length / nrData.keywords.length;
        
        if (confidence > this.config.confidenceThreshold) {
          const nrAnalysis: DetectedNR = {
            number: nrNumber,
            title: `Norma ${nrNumber}`,
            confidence,
            matchedKeywords,
            relevantSlides: [],
            complianceScore: Math.min(90, matchedKeywords.length * 20),
            requiredElements: nrData.requiredElements,
            presentElements: matchedKeywords
          };

          detectedNRs.push(nrAnalysis);
          totalScore += nrAnalysis.complianceScore;
        }
      }
    }

    const overallScore = detectedNRs.length > 0 ? totalScore / detectedNRs.length : 0;
    
    return {
      overallScore,
      detectedNRs,
      complianceLevel: overallScore > 80 ? 'high' : overallScore > 50 ? 'medium' : 'low',
      missingElements: this.identifyMissingElements(detectedNRs),
      recommendations: this.generateNRRecommendations(detectedNRs),
      riskAssessment: {
        level: overallScore > 70 ? 'low' : overallScore > 40 ? 'medium' : 'high',
        factors: overallScore < 50 ? ['Baixa conformidade detectada', 'Elementos obrigatórios ausentes'] : []
      }
    };
  }

  private async assessQuality(content: any): Promise<QualityMetrics> {
    const slides = content.slides || [];

    return {
      contentQuality: this.assessContentQuality(slides),
      structureQuality: this.assessStructureQuality(slides),
      visualQuality: this.assessVisualQuality(slides),
      accessibilityScore: this.assessAccessibility(slides),
      consistencyScore: this.assessConsistency(slides),
      completenessScore: this.assessCompleteness(slides)
    };
  }

  private async analyzeVisualElements(content: any): Promise<VisualElementAnalysis[]> {
    const slides = content.slides || [];
    const visualElements: VisualElementAnalysis[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      // Analisar imagens
      if (slide.images && slide.images > 0) {
        visualElements.push({
          type: 'image',
          slideIndex: i,
          importance: 0.8,
          quality: 0.7,
          suggestedEnhancements: ['Adicionar texto alternativo', 'Otimizar resolução'],
          accessibilityIssues: ['Falta de descrição']
        });
      }

      // Analisar gráficos
      if (slide.charts && slide.charts > 0) {
        visualElements.push({
          type: 'chart',
          slideIndex: i,
          importance: 0.9,
          quality: 0.8,
          suggestedEnhancements: ['Adicionar legendas', 'Melhorar contraste'],
          accessibilityIssues: []
        });
      }

      // Analisar tabelas
      if (slide.tables && slide.tables > 0) {
        visualElements.push({
          type: 'table',
          slideIndex: i,
          importance: 0.7,
          quality: 0.6,
          suggestedEnhancements: ['Adicionar cabeçalhos', 'Melhorar formatação'],
          accessibilityIssues: ['Estrutura de tabela inadequada']
        });
      }
    }

    return visualElements;
  }

  private async generateRecommendations(analysis: ContentAnalysis): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Recomendações de conteúdo
    if (analysis.overview.readabilityScore < 60) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        title: 'Melhorar Legibilidade',
        description: 'O conteúdo apresenta baixa legibilidade. Considere simplificar frases e usar linguagem mais clara.',
        impact: 'Melhora significativa na compreensão',
        effort: 'medium'
      });
    }

    // Recomendações de compliance
    if (analysis.nrCompliance.overallScore < 70) {
      recommendations.push({
        type: 'compliance',
        priority: 'high',
        title: 'Melhorar Conformidade NR',
        description: 'Adicionar elementos obrigatórios das normas regulamentadoras identificadas.',
        impact: 'Conformidade legal e redução de riscos',
        effort: 'high'
      });
    }

    // Recomendações de engajamento
    if (analysis.overview.engagementScore < 50) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        title: 'Aumentar Engajamento',
        description: 'Adicionar elementos interativos como quizzes, animações ou exercícios práticos.',
        impact: 'Maior retenção de conhecimento',
        effort: 'medium'
      });
    }

    // Recomendações visuais
    if (analysis.qualityMetrics.visualQuality < 60) {
      recommendations.push({
        type: 'visual',
        priority: 'medium',
        title: 'Melhorar Elementos Visuais',
        description: 'Otimizar imagens, gráficos e layout para melhor apresentação visual.',
        impact: 'Apresentação mais profissional',
        effort: 'low'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Métodos auxiliares
  private initializeModels(): void {
    // Inicializar base de dados de NRs
    this.nrDatabase.set('NR-06', {
      keywords: ['epi', 'equipamento', 'proteção', 'individual', 'capacete', 'luvas', 'óculos'],
      requiredElements: ['Tipos de EPI', 'Uso correto', 'Manutenção', 'Treinamento'],
      riskFactors: ['Não uso', 'Uso inadequado', 'Equipamento danificado']
    });

    this.nrDatabase.set('NR-12', {
      keywords: ['máquina', 'equipamento', 'segurança', 'proteção', 'dispositivo'],
      requiredElements: ['Proteções', 'Procedimentos', 'Treinamento', 'Manutenção'],
      riskFactors: ['Máquinas desprotegidas', 'Procedimentos inadequados']
    });

    this.nrDatabase.set('NR-10', {
      keywords: ['elétrico', 'energia', 'choque', 'tensão', 'instalação'],
      requiredElements: ['Segurança elétrica', 'Procedimentos', 'Treinamento'],
      riskFactors: ['Choque elétrico', 'Instalações inadequadas']
    });

    this.nrDatabase.set('NR-17', {
      keywords: ['ergonomia', 'postura', 'movimento', 'repetitivo', 'conforto'],
      requiredElements: ['Análise ergonômica', 'Pausas', 'Treinamento'],
      riskFactors: ['Lesões por esforço repetitivo', 'Má postura']
    });

    this.nrDatabase.set('NR-23', {
      keywords: ['incêndio', 'fogo', 'extintor', 'evacuação', 'emergência'],
      requiredElements: ['Prevenção', 'Combate', 'Evacuação'],
      riskFactors: ['Incêndio', 'Falta de equipamentos']
    });

    this.nrDatabase.set('NR-35', {
      keywords: ['altura', 'andaime', 'cinto', 'trabalho em altura'],
      requiredElements: ['Equipamentos', 'Treinamento', 'Procedimentos'],
      riskFactors: ['Quedas', 'Equipamentos inadequados']
    });
  }

  private calculateComplexity(slides: any[], totalWords: number): 'basic' | 'intermediate' | 'advanced' {
    let complexityScore = 0;

    // Fatores de complexidade
    if (totalWords > 1000) complexityScore += 2;
    if (slides.length > 10) complexityScore += 1;
    
    // Verificar elementos complexos
    const hasCharts = slides.some(s => s.charts && s.charts > 0);
    const hasTables = slides.some(s => s.tables && s.tables > 0);
    const hasImages = slides.some(s => s.images && s.images > 0);

    if (hasCharts) complexityScore += 2;
    if (hasTables) complexityScore += 1;
    if (hasImages) complexityScore += 1;

    if (complexityScore >= 5) return 'advanced';
    if (complexityScore >= 3) return 'intermediate';
    return 'basic';
  }

  private calculateReadability(slides: any[]): number {
    // Implementação simplificada do índice Flesch
    const allText = slides.map(s => s.content || '').join(' ');
    const sentences = allText.split(/[.!?]+/).length;
    const words = allText.split(/\s+/).length;
    const syllables = this.countSyllables(allText);

    if (sentences === 0 || words === 0) return 50;

    const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, fleschScore));
  }

  private calculateEngagement(slides: any[]): number {
    let score = 50; // Base score

    // Elementos que aumentam engajamento
    const hasImages = slides.some(s => s.images && s.images > 0);
    const hasCharts = slides.some(s => s.charts && s.charts > 0);
    const hasTables = slides.some(s => s.tables && s.tables > 0);

    if (hasImages) score += 15;
    if (hasCharts) score += 20;
    if (hasTables) score += 10;

    // Penalizar slides muito longos ou muito curtos
    const avgWordsPerSlide = slides.reduce((sum, s) => 
      sum + (s.content?.split(' ').length || 0), 0) / slides.length;

    if (avgWordsPerSlide < 20) score -= 10;
    if (avgWordsPerSlide > 100) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private estimateDuration(slides: any[]): number {
    const baseTimePerSlide = 30; // 30 segundos base
    let totalDuration = 0;

    for (const slide of slides) {
      let slideDuration = baseTimePerSlide;
      
      // Adicionar tempo baseado no conteúdo
      const wordCount = slide.content?.split(' ').length || 0;
      slideDuration += Math.ceil(wordCount / 3) * 1000; // ~180 WPM

      // Adicionar tempo para elementos visuais
      if (slide.images) slideDuration += slide.images * 2000;
      if (slide.charts) slideDuration += slide.charts * 3000;
      if (slide.tables) slideDuration += slide.tables * 2000;

      totalDuration += slideDuration;
    }

    return Math.round(totalDuration / 1000); // Retornar em segundos
  }

  private countSyllables(text: string): number {
    // Implementação simplificada para contar sílabas
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]+/g, 'a')
      .length;
  }

  private createContentHash(content: any): string {
    return createHash('md5')
      .update(JSON.stringify(content))
      .digest('hex');
  }

  private identifyMissingElements(detectedNRs: DetectedNR[]): string[] {
    const missing: string[] = [];
    
    for (const nr of detectedNRs) {
      const missingInNR = nr.requiredElements.filter(element => 
        !nr.presentElements.some(present => 
          present.toLowerCase().includes(element.toLowerCase())
        )
      );
      missing.push(...missingInNR);
    }
    
    return [...new Set(missing)];
  }

  private generateNRRecommendations(detectedNRs: DetectedNR[]): string[] {
    const recommendations: string[] = [];
    
    for (const nr of detectedNRs) {
      if (nr.complianceScore < 70) {
        recommendations.push(`Melhorar conformidade com ${nr.number}: adicionar elementos obrigatórios`);
      }
      
      if (nr.confidence < 0.8) {
        recommendations.push(`Reforçar conteúdo relacionado à ${nr.number}`);
      }
    }
    
    return recommendations;
  }

  private assessContentQuality(slides: any[]): number {
    let score = 50;
    
    // Verificar se há conteúdo suficiente
    const totalWords = slides.reduce((sum, s) => sum + (s.content?.split(' ').length || 0), 0);
    if (totalWords > 500) score += 20;
    if (totalWords > 1000) score += 10;
    
    // Verificar diversidade de conteúdo
    const hasVariedContent = slides.some(s => s.images || s.charts || s.tables);
    if (hasVariedContent) score += 20;
    
    return Math.min(100, score);
  }

  private assessStructureQuality(slides: any[]): number {
    let score = 60;
    
    // Verificar se há estrutura lógica
    if (slides.length > 3) score += 20;
    if (slides.length < 20) score += 10; // Não muito longo
    
    // Verificar se há títulos
    const hasTitles = slides.every(s => s.title && s.title.length > 0);
    if (hasTitles) score += 10;
    
    return Math.min(100, score);
  }

  private assessVisualQuality(slides: any[]): number {
    let score = 40;
    
    // Verificar presença de elementos visuais
    const hasImages = slides.some(s => s.images && s.images > 0);
    const hasCharts = slides.some(s => s.charts && s.charts > 0);
    const hasTables = slides.some(s => s.tables && s.tables > 0);
    
    if (hasImages) score += 20;
    if (hasCharts) score += 25;
    if (hasTables) score += 15;
    
    return Math.min(100, score);
  }

  private assessAccessibility(slides: any[]): number {
    // Implementação básica de acessibilidade
    let score = 60;
    
    // Verificar se há texto alternativo (simulado)
    const hasVisualElements = slides.some(s => s.images || s.charts || s.tables);
    if (hasVisualElements) score -= 20; // Penalizar se não há descrições
    
    return Math.max(0, score);
  }

  private assessConsistency(slides: any[]): number {
    // Verificar consistência de estrutura
    let score = 70;
    
    const avgWordsPerSlide = slides.reduce((sum, s) => 
      sum + (s.content?.split(' ').length || 0), 0) / slides.length;
    
    // Verificar variação de tamanho dos slides
    const variations = slides.map(s => Math.abs((s.content?.split(' ').length || 0) - avgWordsPerSlide));
    const avgVariation = variations.reduce((sum, v) => sum + v, 0) / variations.length;
    
    if (avgVariation < avgWordsPerSlide * 0.5) score += 15;
    
    return Math.min(100, score);
  }

  private assessCompleteness(slides: any[]): number {
    let score = 50;
    
    // Verificar se há introdução, desenvolvimento e conclusão
    if (slides.length >= 3) {
      score += 30; // Estrutura mínima
      
      // Verificar se primeiro slide parece introdução
      const firstSlide = slides[0];
      if (firstSlide.title?.toLowerCase().includes('introdução') || 
          firstSlide.content?.toLowerCase().includes('apresentação')) {
        score += 10;
      }
      
      // Verificar se último slide parece conclusão
      const lastSlide = slides[slides.length - 1];
      if (lastSlide.title?.toLowerCase().includes('conclusão') || 
          lastSlide.content?.toLowerCase().includes('obrigado')) {
        score += 10;
      }
    }
    
    return Math.min(100, score);
  }
}

// Instância singleton
export const enhancedAIAnalysis = new EnhancedAIAnalysis({
  enableGPTVision: true,
  enableNRCompliance: true,
  enableSentimentAnalysis: true,
  enableTopicExtraction: true,
  enableQualityAssessment: true,
  confidenceThreshold: 0.7,
  maxRetries: 3,
  timeoutMs: 30000
});

export default EnhancedAIAnalysis;