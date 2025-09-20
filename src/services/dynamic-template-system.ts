// Sistema de Templates Dinâmicos com IA
import { EventEmitter } from '../utils/EventEmitter';
import { pptxCacheService } from './pptx-cache-service';
import { enhancedAIAnalysis, ContentAnalysis } from './enhanced-ai-analysis';
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

export interface TemplateConfig {
  id: string;
  name: string;
  category: 'safety' | 'training' | 'compliance' | 'corporate' | 'educational';
  description: string;
  features: TemplateFeature[];
  adaptiveRules: AdaptiveRule[];
  baseTemplate: BaseTemplate;
  customizations: TemplateCustomization[];
  performance: TemplatePerformance;
}

export interface TemplateFeature {
  id: string;
  name: string;
  type: 'visual' | 'audio' | 'interactive' | 'animation' | 'layout';
  description: string;
  enabled: boolean;
  config: any;
  requirements?: string[];
}

export interface AdaptiveRule {
  id: string;
  condition: string; // Condição JavaScript
  action: 'enable_feature' | 'disable_feature' | 'modify_config' | 'add_element';
  target: string;
  value: any;
  priority: number;
}

export interface BaseTemplate {
  layout: LayoutConfig;
  styling: StylingConfig;
  animations: AnimationConfig[];
  audio: AudioConfig;
  interactive: InteractiveConfig;
}

export interface LayoutConfig {
  type: 'single_column' | 'two_column' | 'grid' | 'timeline' | 'comparison';
  aspectRatio: '16:9' | '4:3' | '1:1';
  margins: { top: number; right: number; bottom: number; left: number };
  spacing: number;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface StylingConfig {
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingSize: number;
    bodySize: number;
    lineHeight: number;
  };
  effects: {
    shadows: boolean;
    gradients: boolean;
    borders: boolean;
    transparency: number;
  };
}

export interface AnimationConfig {
  id: string;
  type: 'entrance' | 'emphasis' | 'exit' | 'transition';
  effect: string;
  duration: number;
  delay: number;
  easing: string;
  trigger: 'auto' | 'click' | 'scroll' | 'time';
}

export interface AudioConfig {
  enableNarration: boolean;
  voice: {
    language: string;
    gender: 'male' | 'female';
    speed: number;
    pitch: number;
  };
  backgroundMusic: {
    enabled: boolean;
    track: string;
    volume: number;
  };
  soundEffects: {
    enabled: boolean;
    effects: string[];
  };
}

export interface InteractiveConfig {
  enableQuiz: boolean;
  enableNavigation: boolean;
  enableBookmarks: boolean;
  enableNotes: boolean;
  progressIndicator: boolean;
}

export interface TemplateCustomization {
  id: string;
  name: string;
  description: string;
  type: 'color' | 'font' | 'layout' | 'animation' | 'content';
  options: CustomizationOption[];
  defaultValue: any;
  currentValue?: any;
}

export interface CustomizationOption {
  label: string;
  value: any;
  preview?: string;
}

export interface TemplatePerformance {
  renderTime: number;
  fileSize: number;
  compatibility: string[];
  optimizationLevel: 'basic' | 'standard' | 'advanced';
}

export interface GeneratedTemplate {
  id: string;
  name: string;
  config: TemplateConfig;
  adaptations: TemplateAdaptation[];
  performance: TemplatePerformance;
  preview: string;
  confidence: number;
}

export interface TemplateAdaptation {
  rule: string;
  applied: boolean;
  reason: string;
  impact: string;
}

class DynamicTemplateSystem extends EventEmitter {
  private templates: Map<string, TemplateConfig> = new Map();
  private generatedTemplates: Map<string, GeneratedTemplate> = new Map();
  private adaptationRules: Map<string, AdaptiveRule[]> = new Map();

  constructor() {
    super();
    this.initializeBaseTemplates();
    this.initializeAdaptationRules();
  }

  async generateTemplate(
    contentAnalysis: ContentAnalysis,
    preferences: {
      category?: string;
      features?: string[];
      performance?: 'fast' | 'balanced' | 'quality';
      customizations?: any;
    } = {}
  ): Promise<GeneratedTemplate> {
    const analysisHash = this.createAnalysisHash(contentAnalysis, preferences);
    
    // Verificar cache
    const cached = await pptxCacheService.getTemplateRecommendations(analysisHash);
    if (cached && cached.length > 0) {
      this.emit('templateCacheHit', { analysisHash });
      return cached[0];
    }

    this.emit('templateGenerationStart', { analysisHash });

    try {
      // 1. Selecionar template base
      const baseTemplate = await this.selectBaseTemplate(contentAnalysis, preferences);
      
      // 2. Aplicar adaptações baseadas na análise
      const adaptations = await this.applyAdaptations(baseTemplate, contentAnalysis);
      
      // 3. Aplicar customizações do usuário
      const customizedTemplate = await this.applyCustomizations(baseTemplate, preferences.customizations);
      
      // 4. Otimizar performance
      const optimizedTemplate = await this.optimizeTemplate(customizedTemplate, preferences.performance);
      
      // 5. Gerar preview
      const preview = await this.generatePreview(optimizedTemplate);
      
      // 6. Calcular confiança
      const confidence = this.calculateConfidence(contentAnalysis, optimizedTemplate, adaptations);

      const generatedTemplate: GeneratedTemplate = {
        id: `generated-${Date.now()}`,
        name: `${baseTemplate.name} (Adaptado)`,
        config: optimizedTemplate,
        adaptations,
        performance: optimizedTemplate.performance,
        preview,
        confidence
      };

      // Cache do resultado
      await pptxCacheService.cacheTemplateRecommendations(analysisHash, [generatedTemplate]);
      
      this.generatedTemplates.set(generatedTemplate.id, generatedTemplate);

      this.emit('templateGenerationComplete', {
        templateId: generatedTemplate.id,
        confidence,
        adaptationsCount: adaptations.length
      });

      return generatedTemplate;

    } catch (error: any) {
      this.emit('templateGenerationError', { analysisHash, error: error.message });
      throw error;
    }
  }

  async generateMultipleTemplates(
    contentAnalysis: ContentAnalysis,
    count: number = 3,
    preferences: any = {}
  ): Promise<GeneratedTemplate[]> {
    const templates: GeneratedTemplate[] = [];
    
    // Gerar templates com diferentes categorias e estilos
    const categories = ['safety', 'training', 'compliance', 'corporate'];
    const performances = ['fast', 'balanced', 'quality'];
    
    for (let i = 0; i < Math.min(count, 6); i++) {
      const categoryIndex = i % categories.length;
      const performanceIndex = i % performances.length;
      
      try {
        const template = await this.generateTemplate(contentAnalysis, {
          ...preferences,
          category: categories[categoryIndex],
          performance: performances[performanceIndex] as any
        });
        
        templates.push(template);
      } catch (error) {
        console.warn(`Erro ao gerar template ${i + 1}:`, error);
      }
    }

    // Ordenar por confiança
    return templates.sort((a, b) => b.confidence - a.confidence);
  }

  private async selectBaseTemplate(
    analysis: ContentAnalysis,
    preferences: any
  ): Promise<TemplateConfig> {
    let bestTemplate: TemplateConfig | null = null;
    let bestScore = 0;

    for (const [id, template] of this.templates) {
      let score = 0;

      // Score baseado na categoria preferida
      if (preferences.category && template.category === preferences.category) {
        score += 30;
      }

      // Score baseado no conteúdo analisado
      if (analysis.nrCompliance.detectedNRs.length > 0 && template.category === 'safety') {
        score += 25;
      }

      if (analysis.topics.some(t => t.category === 'training') && template.category === 'training') {
        score += 20;
      }

      if (analysis.overview.complexity === 'advanced' && template.features.length > 5) {
        score += 15;
      }

      if (analysis.overview.complexity === 'basic' && template.features.length <= 3) {
        score += 15;
      }

      // Score baseado na qualidade do conteúdo
      if (analysis.qualityMetrics.contentQuality > 80) {
        score += 10;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    return bestTemplate || this.getDefaultTemplate();
  }

  private async applyAdaptations(
    template: TemplateConfig,
    analysis: ContentAnalysis
  ): Promise<TemplateAdaptation[]> {
    const adaptations: TemplateAdaptation[] = [];
    const rules = this.adaptationRules.get(template.category) || [];

    for (const rule of rules) {
      try {
        // Avaliar condição da regra
        const shouldApply = this.evaluateCondition(rule.condition, analysis);
        
        if (shouldApply) {
          // Aplicar adaptação
          this.applyAdaptationRule(template, rule);
          
          adaptations.push({
            rule: rule.id,
            applied: true,
            reason: `Condição atendida: ${rule.condition}`,
            impact: this.getAdaptationImpact(rule)
          });
        }
      } catch (error) {
        console.warn(`Erro ao aplicar regra ${rule.id}:`, error);
      }
    }

    return adaptations.sort((a, b) => b.impact.length - a.impact.length);
  }

  private async applyCustomizations(
    template: TemplateConfig,
    customizations: any = {}
  ): Promise<TemplateConfig> {
    const customizedTemplate = JSON.parse(JSON.stringify(template));

    // Aplicar customizações de cor
    if (customizations.colors) {
      customizedTemplate.baseTemplate.styling.colorScheme = {
        ...customizedTemplate.baseTemplate.styling.colorScheme,
        ...customizations.colors
      };
    }

    // Aplicar customizações de fonte
    if (customizations.fonts) {
      customizedTemplate.baseTemplate.styling.typography = {
        ...customizedTemplate.baseTemplate.styling.typography,
        ...customizations.fonts
      };
    }

    // Aplicar customizações de layout
    if (customizations.layout) {
      customizedTemplate.baseTemplate.layout = {
        ...customizedTemplate.baseTemplate.layout,
        ...customizations.layout
      };
    }

    // Aplicar customizações de recursos
    if (customizations.features) {
      for (const feature of customizedTemplate.features) {
        if (customizations.features[feature.id] !== undefined) {
          feature.enabled = customizations.features[feature.id];
        }
      }
    }

    return customizedTemplate;
  }

  private async optimizeTemplate(
    template: TemplateConfig,
    performance: 'fast' | 'balanced' | 'quality' = 'balanced'
  ): Promise<TemplateConfig> {
    const optimizedTemplate = JSON.parse(JSON.stringify(template));

    switch (performance) {
      case 'fast':
        // Desabilitar recursos pesados
        optimizedTemplate.features = optimizedTemplate.features.filter((f: TemplateFeature) =>
          f.type !== 'animation' || f.config?.complexity !== 'high'
        );
        optimizedTemplate.baseTemplate.animations = optimizedTemplate.baseTemplate.animations.filter((a: AnimationConfig) =>
          a.duration <= 1000
        );
        optimizedTemplate.performance.optimizationLevel = 'basic';
        break;

      case 'quality':
        // Habilitar todos os recursos
        optimizedTemplate.features.forEach((f: TemplateFeature) => f.enabled = true);
        optimizedTemplate.performance.optimizationLevel = 'advanced';
        break;

      case 'balanced':
      default:
        // Balancear recursos
        optimizedTemplate.performance.optimizationLevel = 'standard';
        break;
    }

    return optimizedTemplate;
  }

  private async generatePreview(template: TemplateConfig): Promise<string> {
    // Gerar preview baseado no template
    const previewData = {
      layout: template.baseTemplate.layout.type,
      colors: template.baseTemplate.styling.colorScheme,
      features: template.features.filter(f => f.enabled).map(f => f.name),
      animations: template.baseTemplate.animations.length
    };

    // Simular geração de preview (em produção, geraria imagem real)
    return `data:image/svg+xml;base64,${Buffer.from(this.generateSVGPreview(previewData)).toString('base64')}`;
  }

  private calculateConfidence(
    analysis: ContentAnalysis,
    template: TemplateConfig,
    adaptations: TemplateAdaptation[]
  ): number {
    let confidence = 50; // Base

    // Confiança baseada na categoria
    if (analysis.nrCompliance.detectedNRs.length > 0 && template.category === 'safety') {
      confidence += 20;
    }

    // Confiança baseada na complexidade
    const complexityMatch = this.getComplexityMatch(analysis.overview.complexity, template);
    confidence += complexityMatch * 15;

    // Confiança baseada nas adaptações aplicadas
    confidence += Math.min(adaptations.length * 5, 20);

    // Confiança baseada na qualidade do conteúdo
    confidence += (analysis.qualityMetrics.contentQuality / 100) * 10;

    return Math.min(100, Math.max(0, confidence));
  }

  // Métodos auxiliares
  private initializeBaseTemplates(): void {
    // Template de Segurança NR
    this.templates.set('nr-safety-standard', {
      id: 'nr-safety-standard',
      name: 'NR Safety Standard',
      category: 'safety',
      description: 'Template otimizado para treinamentos de segurança conforme NRs',
      features: [
        {
          id: 'safety-icons',
          name: 'Ícones de Segurança',
          type: 'visual',
          description: 'Ícones padronizados para EPIs e procedimentos',
          enabled: true,
          config: { iconSet: 'safety', size: 'large' }
        },
        {
          id: 'compliance-checklist',
          name: 'Checklist de Compliance',
          type: 'interactive',
          description: 'Lista interativa de verificação de conformidade',
          enabled: true,
          config: { style: 'checkbox', validation: true }
        },
        {
          id: 'emergency-alerts',
          name: 'Alertas de Emergência',
          type: 'visual',
          description: 'Destacar informações críticas de segurança',
          enabled: true,
          config: { color: 'red', animation: 'pulse' }
        }
      ],
      adaptiveRules: [],
      baseTemplate: this.createSafetyBaseTemplate(),
      customizations: [],
      performance: {
        renderTime: 2000,
        fileSize: 5120,
        compatibility: ['web', 'mobile', 'desktop'],
        optimizationLevel: 'standard'
      }
    });

    // Template de Treinamento Corporativo
    this.templates.set('corporate-training', {
      id: 'corporate-training',
      name: 'Corporate Training',
      category: 'training',
      description: 'Template profissional para treinamentos corporativos',
      features: [
        {
          id: 'progress-tracker',
          name: 'Rastreador de Progresso',
          type: 'interactive',
          description: 'Barra de progresso e navegação',
          enabled: true,
          config: { style: 'modern', showPercentage: true }
        },
        {
          id: 'knowledge-quiz',
          name: 'Quiz de Conhecimento',
          type: 'interactive',
          description: 'Perguntas interativas para fixação',
          enabled: true,
          config: { questionTypes: ['multiple-choice', 'true-false'] }
        }
      ],
      adaptiveRules: [],
      baseTemplate: this.createCorporateBaseTemplate(),
      customizations: [],
      performance: {
        renderTime: 1500,
        fileSize: 4096,
        compatibility: ['web', 'mobile'],
        optimizationLevel: 'standard'
      }
    });

    // Adicionar mais templates...
  }

  private initializeAdaptationRules(): void {
    // Regras para templates de segurança
    this.adaptationRules.set('safety', [
      {
        id: 'enable-nr-compliance',
        condition: 'analysis.nrCompliance.detectedNRs.length > 0',
        action: 'enable_feature',
        target: 'compliance-checklist',
        value: true,
        priority: 10
      },
      {
        id: 'high-risk-alerts',
        condition: 'analysis.nrCompliance.riskAssessment.level === "high"',
        action: 'enable_feature',
        target: 'emergency-alerts',
        value: true,
        priority: 9
      },
      {
        id: 'complex-content-navigation',
        condition: 'analysis.overview.complexity === "advanced"',
        action: 'enable_feature',
        target: 'progress-tracker',
        value: true,
        priority: 7
      }
    ]);

    // Regras para templates de treinamento
    this.adaptationRules.set('training', [
      {
        id: 'enable-quiz-for-educational',
        condition: 'analysis.sentiment.emotions.educational > 0.7',
        action: 'enable_feature',
        target: 'knowledge-quiz',
        value: true,
        priority: 8
      },
      {
        id: 'progress-for-long-content',
        condition: 'analysis.overview.estimatedDuration > 300',
        action: 'enable_feature',
        target: 'progress-tracker',
        value: true,
        priority: 6
      }
    ]);
  }

  private createSafetyBaseTemplate(): BaseTemplate {
    return {
      layout: {
        type: 'single_column',
        aspectRatio: '16:9',
        margins: { top: 40, right: 40, bottom: 40, left: 40 },
        spacing: 20,
        alignment: 'left'
      },
      styling: {
        colorScheme: {
          primary: '#DC2626', // Red for safety
          secondary: '#FEF3C7', // Yellow for warnings
          accent: '#059669', // Green for safe
          background: '#FFFFFF',
          text: '#1F2937'
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          headingSize: 32,
          bodySize: 18,
          lineHeight: 1.6
        },
        effects: {
          shadows: true,
          gradients: false,
          borders: true,
          transparency: 0.9
        }
      },
      animations: [
        {
          id: 'safety-entrance',
          type: 'entrance',
          effect: 'slideInLeft',
          duration: 800,
          delay: 0,
          easing: 'ease-out',
          trigger: 'auto'
        }
      ],
      audio: {
        enableNarration: true,
        voice: {
          language: 'pt-BR',
          gender: 'male',
          speed: 0.9,
          pitch: 1.0
        },
        backgroundMusic: {
          enabled: false,
          track: '',
          volume: 0.3
        },
        soundEffects: {
          enabled: true,
          effects: ['alert', 'success', 'warning']
        }
      },
      interactive: {
        enableQuiz: true,
        enableNavigation: true,
        enableBookmarks: false,
        enableNotes: true,
        progressIndicator: true
      }
    };
  }

  private createCorporateBaseTemplate(): BaseTemplate {
    return {
      layout: {
        type: 'two_column',
        aspectRatio: '16:9',
        margins: { top: 30, right: 30, bottom: 30, left: 30 },
        spacing: 15,
        alignment: 'left'
      },
      styling: {
        colorScheme: {
          primary: '#1E40AF', // Corporate blue
          secondary: '#E5E7EB', // Light gray
          accent: '#10B981', // Success green
          background: '#F9FAFB',
          text: '#374151'
        },
        typography: {
          headingFont: 'Roboto',
          bodyFont: 'Roboto',
          headingSize: 28,
          bodySize: 16,
          lineHeight: 1.5
        },
        effects: {
          shadows: true,
          gradients: true,
          borders: false,
          transparency: 1.0
        }
      },
      animations: [
        {
          id: 'corporate-fade',
          type: 'entrance',
          effect: 'fadeIn',
          duration: 600,
          delay: 200,
          easing: 'ease-in-out',
          trigger: 'auto'
        }
      ],
      audio: {
        enableNarration: true,
        voice: {
          language: 'pt-BR',
          gender: 'female',
          speed: 1.0,
          pitch: 1.0
        },
        backgroundMusic: {
          enabled: true,
          track: 'corporate-ambient',
          volume: 0.2
        },
        soundEffects: {
          enabled: false,
          effects: []
        }
      },
      interactive: {
        enableQuiz: true,
        enableNavigation: true,
        enableBookmarks: true,
        enableNotes: true,
        progressIndicator: true
      }
    };
  }

  private getDefaultTemplate(): TemplateConfig {
    return this.templates.get('corporate-training')!;
  }

  private evaluateCondition(condition: string, analysis: ContentAnalysis): boolean {
    try {
      // Criar contexto seguro para avaliação
      const context = { analysis };
      const func = new Function('analysis', `return ${condition}`);
      return func(analysis);
    } catch (error) {
      console.warn('Erro ao avaliar condição:', condition, error);
      return false;
    }
  }

  private applyAdaptationRule(template: TemplateConfig, rule: AdaptiveRule): void {
    switch (rule.action) {
      case 'enable_feature':
        const feature = template.features.find(f => f.id === rule.target);
        if (feature) {
          feature.enabled = rule.value;
        }
        break;
      
      case 'modify_config':
        const targetFeature = template.features.find(f => f.id === rule.target);
        if (targetFeature) {
          targetFeature.config = { ...targetFeature.config, ...rule.value };
        }
        break;
    }
  }

  private getAdaptationImpact(rule: AdaptiveRule): string {
    const impacts = {
      'enable_feature': 'Recurso habilitado para melhor experiência',
      'disable_feature': 'Recurso desabilitado para otimização',
      'modify_config': 'Configuração ajustada automaticamente',
      'add_element': 'Elemento adicionado baseado no conteúdo'
    };
    
    return impacts[rule.action] || 'Adaptação aplicada';
  }

  private getComplexityMatch(complexity: string, template: TemplateConfig): number {
    const featureCount = template.features.length;
    
    switch (complexity) {
      case 'basic':
        return featureCount <= 3 ? 1 : 0.5;
      case 'intermediate':
        return featureCount >= 3 && featureCount <= 6 ? 1 : 0.7;
      case 'advanced':
        return featureCount > 6 ? 1 : 0.6;
      default:
        return 0.5;
    }
  }

  private generateSVGPreview(previewData: any): string {
    return `
      <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="${previewData.colors.background}"/>
        <rect x="20" y="20" width="280" height="40" fill="${previewData.colors.primary}" rx="5"/>
        <text x="30" y="45" fill="white" font-family="Arial" font-size="16">Template Preview</text>
        <rect x="20" y="80" width="280" height="80" fill="${previewData.colors.secondary}" rx="5"/>
        <text x="30" y="105" fill="${previewData.colors.text}" font-family="Arial" font-size="12">
          Layout: ${previewData.layout}
        </text>
        <text x="30" y="125" fill="${previewData.colors.text}" font-family="Arial" font-size="12">
          Features: ${previewData.features.slice(0, 2).join(', ')}
        </text>
        <text x="30" y="145" fill="${previewData.colors.text}" font-family="Arial" font-size="12">
          Animations: ${previewData.animations}
        </text>
      </svg>
    `;
  }

  private createAnalysisHash(analysis: ContentAnalysis, preferences: any): string {
    const data = JSON.stringify({ analysis, preferences });
    return createHash('md5').update(data).digest('hex');
  }

  // Métodos públicos de gerenciamento
  getAvailableTemplates(): TemplateConfig[] {
    return Array.from(this.templates.values());
  }

  getTemplateById(id: string): TemplateConfig | undefined {
    return this.templates.get(id);
  }

  getGeneratedTemplate(id: string): GeneratedTemplate | undefined {
    return this.generatedTemplates.get(id);
  }

  async previewTemplate(templateId: string, sampleContent: any): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    return this.generatePreview(template);
  }

  dispose(): void {
    this.templates.clear();
    this.generatedTemplates.clear();
    this.adaptationRules.clear();
    this.emit('disposed');
  }
}

// Instância singleton
export const dynamicTemplateSystem = new DynamicTemplateSystem();

export default DynamicTemplateSystem;