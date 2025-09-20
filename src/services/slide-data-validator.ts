// Sistema de validação robusta de dados de slides PPTX com auto-correção
import { PPTXSlide, PPTXImage, PPTXShape, PPTXAnimation, PPTXBackground } from './PPTXAnalysisSystem';

// Interfaces para validação
interface ValidationRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validate: (slide: PPTXSlide) => ValidationResult;
  autoCorrect?: (slide: PPTXSlide) => PPTXSlide;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  correctedData?: any;
}

interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixable: boolean;
}

interface ValidationWarning {
  code: string;
  message: string;
  field: string;
  suggestion: string;
}

interface ValidationConfig {
  enableAutoCorrection: boolean;
  strictMode: boolean;
  customRules: ValidationRule[];
  skipRules: string[];
  maxErrors: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface ValidationReport {
  totalSlides: number;
  validSlides: number;
  invalidSlides: number;
  correctedSlides: number;
  totalErrors: number;
  totalWarnings: number;
  processingTime: number;
  summary: ValidationSummary;
  details: SlideValidationResult[];
}

interface ValidationSummary {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  criticalIssues: number;
  autoFixedIssues: number;
  manualFixRequired: number;
  recommendations: string[];
}

interface SlideValidationResult {
  slideId: string;
  slideIndex: number;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  correctedSlide?: PPTXSlide;
  processingTime: number;
}

// Sistema principal de validação
export class SlideDataValidator {
  private config: ValidationConfig;
  private rules: Map<string, ValidationRule>;
  private stats: {
    totalValidations: number;
    successfulValidations: number;
    autoCorrections: number;
    processingTime: number;
  };

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      enableAutoCorrection: true,
      strictMode: false,
      customRules: [],
      skipRules: [],
      maxErrors: 100,
      logLevel: 'info',
      ...config
    };

    this.rules = new Map();
    this.stats = {
      totalValidations: 0,
      successfulValidations: 0,
      autoCorrections: 0,
      processingTime: 0
    };

    this.initializeDefaultRules();
    this.loadCustomRules();
  }

  // Validar um slide individual
  public async validateSlide(slide: PPTXSlide): Promise<SlideValidationResult> {
    const startTime = performance.now();
    this.stats.totalValidations++;

    try {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      let correctedSlide: PPTXSlide | undefined;

      // Executar todas as regras de validação
      for (const [ruleName, rule] of this.rules) {
        if (this.config.skipRules.includes(ruleName)) {
          continue;
        }

        try {
          const result = rule.validate(slide);
          
          errors.push(...result.errors);
          warnings.push(...result.warnings);

          // Auto-correção se habilitada e disponível
          if (this.config.enableAutoCorrection && 
              rule.autoCorrect && 
              result.errors.some(e => e.autoFixable)) {
            correctedSlide = rule.autoCorrect(correctedSlide || slide);
            this.stats.autoCorrections++;
          }
        } catch (error) {
          this.logError(`Erro ao executar regra ${ruleName}:`, error);
          errors.push({
            code: 'RULE_EXECUTION_ERROR',
            message: `Erro interno na validação: ${error.message}`,
            field: 'system',
            severity: 'medium',
            autoFixable: false
          });
        }
      }

      const isValid = errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0;
      
      if (isValid) {
        this.stats.successfulValidations++;
      }

      const processingTime = performance.now() - startTime;
      this.stats.processingTime += processingTime;

      return {
        slideId: slide.id,
        slideIndex: parseInt(slide.id.replace('slide_', '')) || 0,
        isValid,
        errors: errors.slice(0, this.config.maxErrors),
        warnings,
        correctedSlide,
        processingTime
      };

    } catch (error) {
      this.logError('Erro crítico na validação do slide:', error);
      
      return {
        slideId: slide.id,
        slideIndex: 0,
        isValid: false,
        errors: [{
          code: 'CRITICAL_VALIDATION_ERROR',
          message: `Erro crítico na validação: ${error.message}`,
          field: 'system',
          severity: 'critical',
          autoFixable: false
        }],
        warnings: [],
        processingTime: performance.now() - startTime
      };
    }
  }

  // Validar múltiplos slides
  public async validateSlides(slides: PPTXSlide[]): Promise<ValidationReport> {
    const startTime = performance.now();
    const results: SlideValidationResult[] = [];

    // Processar slides em paralelo (limitado)
    const batchSize = 5;
    for (let i = 0; i < slides.length; i += batchSize) {
      const batch = slides.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(slide => this.validateSlide(slide))
      );
      results.push(...batchResults);
    }

    // Compilar relatório
    const totalSlides = slides.length;
    const validSlides = results.filter(r => r.isValid).length;
    const invalidSlides = totalSlides - validSlides;
    const correctedSlides = results.filter(r => r.correctedSlide).length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
    const processingTime = performance.now() - startTime;

    const summary = this.generateSummary(results);

    return {
      totalSlides,
      validSlides,
      invalidSlides,
      correctedSlides,
      totalErrors,
      totalWarnings,
      processingTime,
      summary,
      details: results
    };
  }

  // Inicializar regras padrão
  private initializeDefaultRules(): void {
    // Regra: Validação de conteúdo de texto
    this.rules.set('text_content', {
      name: 'Validação de Conteúdo de Texto',
      description: 'Verifica se o conteúdo de texto está presente e válido',
      severity: 'error',
      validate: (slide: PPTXSlide): ValidationResult => {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const suggestions: string[] = [];

        // Verificar título
        if (!slide.title || slide.title.trim().length === 0) {
          errors.push({
            code: 'MISSING_TITLE',
            message: 'Slide não possui título',
            field: 'title',
            severity: 'high',
            autoFixable: true
          });
        } else if (slide.title.length > 100) {
          warnings.push({
            code: 'LONG_TITLE',
            message: 'Título muito longo (>100 caracteres)',
            field: 'title',
            suggestion: 'Considere encurtar o título para melhor legibilidade'
          });
        }

        // Verificar conteúdo
        if (!slide.content || slide.content.trim().length === 0) {
          warnings.push({
            code: 'EMPTY_CONTENT',
            message: 'Slide não possui conteúdo de texto',
            field: 'content',
            suggestion: 'Adicione conteúdo textual para melhor acessibilidade'
          });
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
          suggestions
        };
      },
      autoCorrect: (slide: PPTXSlide): PPTXSlide => {
        const corrected = { ...slide };
        
        if (!corrected.title || corrected.title.trim().length === 0) {
          corrected.title = `Slide ${slide.id.replace('slide_', '')}`;
        }
        
        return corrected;
      }
    });

    // Regra: Validação de imagens
    this.rules.set('image_validation', {
      name: 'Validação de Imagens',
      description: 'Verifica integridade e propriedades das imagens',
      severity: 'warning',
      validate: (slide: PPTXSlide): ValidationResult => {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const suggestions: string[] = [];

        slide.images?.forEach((image, index) => {
          // Verificar src da imagem
          if (!image.src || image.src.trim().length === 0) {
            errors.push({
              code: 'MISSING_IMAGE_SRC',
              message: `Imagem ${index + 1} não possui fonte válida`,
              field: `images[${index}].src`,
              severity: 'high',
              autoFixable: false
            });
          }

          // Verificar alt text
          if (!image.alt || image.alt.trim().length === 0) {
            warnings.push({
              code: 'MISSING_ALT_TEXT',
              message: `Imagem ${index + 1} não possui texto alternativo`,
              field: `images[${index}].alt`,
              suggestion: 'Adicione texto alternativo para acessibilidade'
            });
          }

          // Verificar posicionamento
          if (image.position.width <= 0 || image.position.height <= 0) {
            errors.push({
              code: 'INVALID_IMAGE_DIMENSIONS',
              message: `Imagem ${index + 1} possui dimensões inválidas`,
              field: `images[${index}].position`,
              severity: 'medium',
              autoFixable: true
            });
          }
        });

        return {
          isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
          errors,
          warnings,
          suggestions
        };
      },
      autoCorrect: (slide: PPTXSlide): PPTXSlide => {
        const corrected = { ...slide };
        
        corrected.images = corrected.images?.map((image, index) => {
          const correctedImage = { ...image };
          
          // Corrigir dimensões inválidas
          if (correctedImage.position.width <= 0) {
            correctedImage.position.width = 100;
          }
          if (correctedImage.position.height <= 0) {
            correctedImage.position.height = 100;
          }
          
          // Adicionar alt text padrão se ausente
          if (!correctedImage.alt || correctedImage.alt.trim().length === 0) {
            correctedImage.alt = `Imagem ${index + 1}`;
          }
          
          return correctedImage;
        }) || [];
        
        return corrected;
      }
    });

    // Regra: Validação de estrutura
    this.rules.set('structure_validation', {
      name: 'Validação de Estrutura',
      description: 'Verifica a estrutura geral do slide',
      severity: 'error',
      validate: (slide: PPTXSlide): ValidationResult => {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const suggestions: string[] = [];

        // Verificar ID do slide
        if (!slide.id || slide.id.trim().length === 0) {
          errors.push({
            code: 'MISSING_SLIDE_ID',
            message: 'Slide não possui ID válido',
            field: 'id',
            severity: 'critical',
            autoFixable: true
          });
        }

        // Verificar duração
        if (slide.duration <= 0) {
          warnings.push({
            code: 'INVALID_DURATION',
            message: 'Duração do slide é inválida ou não definida',
            field: 'duration',
            suggestion: 'Defina uma duração apropriada para o slide'
          });
        }

        // Verificar layout
        if (!slide.layout || slide.layout.trim().length === 0) {
          warnings.push({
            code: 'MISSING_LAYOUT',
            message: 'Layout do slide não está definido',
            field: 'layout',
            suggestion: 'Defina um layout para melhor estruturação'
          });
        }

        return {
          isValid: errors.filter(e => e.severity === 'critical').length === 0,
          errors,
          warnings,
          suggestions
        };
      },
      autoCorrect: (slide: PPTXSlide): PPTXSlide => {
        const corrected = { ...slide };
        
        // Gerar ID se ausente
        if (!corrected.id || corrected.id.trim().length === 0) {
          corrected.id = `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Definir duração padrão
        if (corrected.duration <= 0) {
          corrected.duration = 5; // 5 segundos padrão
        }
        
        // Definir layout padrão
        if (!corrected.layout || corrected.layout.trim().length === 0) {
          corrected.layout = 'default';
        }
        
        return corrected;
      }
    });
  }

  // Carregar regras customizadas
  private loadCustomRules(): void {
    this.config.customRules.forEach(rule => {
      this.rules.set(rule.name, rule);
    });
  }

  // Gerar resumo da validação
  private generateSummary(results: SlideValidationResult[]): ValidationSummary {
    const criticalIssues = results.reduce((sum, r) => 
      sum + r.errors.filter(e => e.severity === 'critical').length, 0
    );
    
    const autoFixedIssues = results.filter(r => r.correctedSlide).length;
    const manualFixRequired = results.reduce((sum, r) => 
      sum + r.errors.filter(e => !e.autoFixable).length, 0
    );

    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    const validPercentage = (results.filter(r => r.isValid).length / results.length) * 100;
    
    if (validPercentage >= 95) overallHealth = 'excellent';
    else if (validPercentage >= 80) overallHealth = 'good';
    else if (validPercentage >= 60) overallHealth = 'fair';
    else overallHealth = 'poor';

    const recommendations: string[] = [];
    
    if (criticalIssues > 0) {
      recommendations.push(`Corrija ${criticalIssues} problemas críticos antes de prosseguir`);
    }
    
    if (manualFixRequired > 0) {
      recommendations.push(`${manualFixRequired} problemas requerem correção manual`);
    }
    
    if (autoFixedIssues > 0) {
      recommendations.push(`${autoFixedIssues} problemas foram corrigidos automaticamente`);
    }

    return {
      overallHealth,
      criticalIssues,
      autoFixedIssues,
      manualFixRequired,
      recommendations
    };
  }

  // Utilitários
  public getStats() {
    return { ...this.stats };
  }

  public updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public addCustomRule(rule: ValidationRule): void {
    this.rules.set(rule.name, rule);
  }

  public removeRule(ruleName: string): void {
    this.rules.delete(ruleName);
  }

  private logError(message: string, error: any): void {
    if (this.config.logLevel === 'debug' || this.config.logLevel === 'error') {
      console.error(`[SlideDataValidator] ${message}`, error);
    }
  }

  private logInfo(message: string): void {
    if (this.config.logLevel === 'debug' || this.config.logLevel === 'info') {
    }
  }
}

// Funções utilitárias para validação
export const ValidationUtils = {
  // Validar formato de cor
  isValidColor: (color: string): boolean => {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(\d+,\s*\d+,\s*\d+\)$|^rgba\(\d+,\s*\d+,\s*\d+,\s*[01]?\.?\d*\)$/;
    return colorRegex.test(color);
  },

  // Validar URL de imagem
  isValidImageUrl: (url: string): boolean => {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(url);
    } catch {
      return false;
    }
  },

  // Sanitizar texto
  sanitizeText: (text: string): string => {
    return text.replace(/<script[^>]*>.*?<\/script>/gi, '')
               .replace(/<[^>]*>/g, '')
               .trim();
  },

  // Validar posicionamento
  isValidPosition: (position: { x: number; y: number; width: number; height: number }): boolean => {
    return position.x >= 0 && position.y >= 0 && 
           position.width > 0 && position.height > 0;
  }
};

// Exportar tipos
export type {
  ValidationRule,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationConfig,
  ValidationReport,
  ValidationSummary,
  SlideValidationResult
};