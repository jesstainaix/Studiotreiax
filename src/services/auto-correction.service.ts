// Serviço de auto-correção avançada para slides PPTX
import { PPTXSlide, PPTXImage, PPTXShape, PPTXAnimation } from './PPTXAnalysisSystem';
import { ValidationError, ValidationWarning } from './slide-data-validator';

// Interfaces para auto-correção
interface CorrectionRule {
  name: string;
  description: string;
  errorCodes: string[];
  priority: number;
  canAutoFix: (error: ValidationError, slide: PPTXSlide) => boolean;
  applyFix: (error: ValidationError, slide: PPTXSlide) => PPTXSlide;
  confidence: number; // 0-1, confiança na correção
}

interface CorrectionResult {
  success: boolean;
  correctedSlide: PPTXSlide;
  appliedFixes: AppliedFix[];
  remainingErrors: ValidationError[];
  processingTime: number;
  confidence: number;
}

interface AppliedFix {
  ruleName: string;
  errorCode: string;
  description: string;
  field: string;
  oldValue: any;
  newValue: any;
  confidence: number;
}

interface CorrectionConfig {
  enableAggressiveCorrection: boolean;
  minConfidenceThreshold: number;
  maxCorrectionsPerSlide: number;
  preserveOriginalData: boolean;
  backupBeforeCorrection: boolean;
  logCorrections: boolean;
}

interface CorrectionStats {
  totalCorrections: number;
  successfulCorrections: number;
  failedCorrections: number;
  averageConfidence: number;
  processingTime: number;
  correctionsByType: Map<string, number>;
}

// Serviço principal de auto-correção
export class AutoCorrectionService {
  private config: CorrectionConfig;
  private rules: Map<string, CorrectionRule>;
  private stats: CorrectionStats;
  private backups: Map<string, PPTXSlide>;

  constructor(config: Partial<CorrectionConfig> = {}) {
    this.config = {
      enableAggressiveCorrection: false,
      minConfidenceThreshold: 0.7,
      maxCorrectionsPerSlide: 10,
      preserveOriginalData: true,
      backupBeforeCorrection: true,
      logCorrections: true,
      ...config
    };

    this.rules = new Map();
    this.backups = new Map();
    this.stats = {
      totalCorrections: 0,
      successfulCorrections: 0,
      failedCorrections: 0,
      averageConfidence: 0,
      processingTime: 0,
      correctionsByType: new Map()
    };

    this.initializeCorrectionRules();
  }

  // Aplicar correções automáticas a um slide
  public async correctSlide(
    slide: PPTXSlide, 
    errors: ValidationError[]
  ): Promise<CorrectionResult> {
    const startTime = performance.now();
    this.stats.totalCorrections++;

    try {
      // Backup do slide original
      if (this.config.backupBeforeCorrection) {
        this.backups.set(slide.id, JSON.parse(JSON.stringify(slide)));
      }

      let correctedSlide = JSON.parse(JSON.stringify(slide));
      const appliedFixes: AppliedFix[] = [];
      const remainingErrors: ValidationError[] = [];
      let totalConfidence = 0;

      // Ordenar erros por prioridade e confiança
      const sortedErrors = errors
        .filter(error => error.autoFixable)
        .sort((a, b) => {
          const ruleA = this.findRuleForError(a);
          const ruleB = this.findRuleForError(b);
          return (ruleB?.priority || 0) - (ruleA?.priority || 0);
        })
        .slice(0, this.config.maxCorrectionsPerSlide);

      // Aplicar correções
      for (const error of sortedErrors) {
        const rule = this.findRuleForError(error);
        
        if (!rule) {
          remainingErrors.push(error);
          continue;
        }

        if (!rule.canAutoFix(error, correctedSlide)) {
          remainingErrors.push(error);
          continue;
        }

        if (rule.confidence < this.config.minConfidenceThreshold) {
          remainingErrors.push(error);
          continue;
        }

        try {
          const oldValue = this.getFieldValue(correctedSlide, error.field);
          const fixedSlide = rule.applyFix(error, correctedSlide);
          const newValue = this.getFieldValue(fixedSlide, error.field);

          appliedFixes.push({
            ruleName: rule.name,
            errorCode: error.code,
            description: rule.description,
            field: error.field,
            oldValue,
            newValue,
            confidence: rule.confidence
          });

          correctedSlide = fixedSlide;
          totalConfidence += rule.confidence;

          // Atualizar estatísticas
          const currentCount = this.stats.correctionsByType.get(error.code) || 0;
          this.stats.correctionsByType.set(error.code, currentCount + 1);

          if (this.config.logCorrections) {
          }

        } catch (fixError) {
          console.error(`[AutoCorrection] Erro ao aplicar correção ${rule.name}:`, fixError);
          remainingErrors.push(error);
        }
      }

      // Adicionar erros não corrigíveis
      remainingErrors.push(...errors.filter(error => !error.autoFixable));

      const averageConfidence = appliedFixes.length > 0 
        ? totalConfidence / appliedFixes.length 
        : 0;

      const processingTime = performance.now() - startTime;
      this.stats.processingTime += processingTime;

      if (appliedFixes.length > 0) {
        this.stats.successfulCorrections++;
      } else {
        this.stats.failedCorrections++;
      }

      // Atualizar média de confiança
      this.stats.averageConfidence = 
        (this.stats.averageConfidence * (this.stats.totalCorrections - 1) + averageConfidence) / 
        this.stats.totalCorrections;

      return {
        success: appliedFixes.length > 0,
        correctedSlide,
        appliedFixes,
        remainingErrors,
        processingTime,
        confidence: averageConfidence
      };

    } catch (error) {
      this.stats.failedCorrections++;
      console.error('[AutoCorrection] Erro crítico na correção:', error);
      
      return {
        success: false,
        correctedSlide: slide,
        appliedFixes: [],
        remainingErrors: errors,
        processingTime: performance.now() - startTime,
        confidence: 0
      };
    }
  }

  // Inicializar regras de correção
  private initializeCorrectionRules(): void {
    // Regra: Correção de título ausente
    this.rules.set('missing_title_fix', {
      name: 'Correção de Título Ausente',
      description: 'Gera título automático baseado no conteúdo do slide',
      errorCodes: ['MISSING_TITLE'],
      priority: 10,
      confidence: 0.8,
      canAutoFix: (error: ValidationError, slide: PPTXSlide): boolean => {
        return error.code === 'MISSING_TITLE' && 
               (!slide.title || slide.title.trim().length === 0);
      },
      applyFix: (error: ValidationError, slide: PPTXSlide): PPTXSlide => {
        const corrected = { ...slide };
        
        // Tentar gerar título baseado no conteúdo
        if (slide.content && slide.content.trim().length > 0) {
          const firstSentence = slide.content.split('.')[0].trim();
          corrected.title = firstSentence.length > 50 
            ? firstSentence.substring(0, 47) + '...' 
            : firstSentence;
        } else if (slide.images && slide.images.length > 0) {
          corrected.title = `Slide com ${slide.images.length} imagem${slide.images.length > 1 ? 'ns' : ''}`;
        } else {
          const slideNumber = slide.id.replace('slide_', '') || '1';
          corrected.title = `Slide ${slideNumber}`;
        }
        
        return corrected;
      }
    });

    // Regra: Correção de dimensões de imagem inválidas
    this.rules.set('image_dimensions_fix', {
      name: 'Correção de Dimensões de Imagem',
      description: 'Corrige dimensões inválidas de imagens',
      errorCodes: ['INVALID_IMAGE_DIMENSIONS'],
      priority: 8,
      confidence: 0.9,
      canAutoFix: (error: ValidationError, slide: PPTXSlide): boolean => {
        return error.code === 'INVALID_IMAGE_DIMENSIONS' && 
               slide.images && slide.images.length > 0;
      },
      applyFix: (error: ValidationError, slide: PPTXSlide): PPTXSlide => {
        const corrected = { ...slide };
        
        corrected.images = corrected.images?.map(image => {
          const correctedImage = { ...image };
          
          // Corrigir largura inválida
          if (correctedImage.position.width <= 0) {
            correctedImage.position.width = 200; // Largura padrão
          }
          
          // Corrigir altura inválida
          if (correctedImage.position.height <= 0) {
            correctedImage.position.height = 150; // Altura padrão
          }
          
          // Garantir proporção mínima
          const aspectRatio = correctedImage.position.width / correctedImage.position.height;
          if (aspectRatio < 0.1 || aspectRatio > 10) {
            correctedImage.position.height = correctedImage.position.width * 0.75;
          }
          
          return correctedImage;
        }) || [];
        
        return corrected;
      }
    });

    // Regra: Correção de ID de slide ausente
    this.rules.set('missing_slide_id_fix', {
      name: 'Correção de ID de Slide',
      description: 'Gera ID único para slides sem identificação',
      errorCodes: ['MISSING_SLIDE_ID'],
      priority: 9,
      confidence: 1.0,
      canAutoFix: (error: ValidationError, slide: PPTXSlide): boolean => {
        return error.code === 'MISSING_SLIDE_ID' && 
               (!slide.id || slide.id.trim().length === 0);
      },
      applyFix: (error: ValidationError, slide: PPTXSlide): PPTXSlide => {
        const corrected = { ...slide };
        
        // Gerar ID único
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        corrected.id = `slide_${timestamp}_${random}`;
        
        return corrected;
      }
    });

    // Regra: Correção de duração inválida
    this.rules.set('invalid_duration_fix', {
      name: 'Correção de Duração',
      description: 'Define duração padrão para slides com duração inválida',
      errorCodes: ['INVALID_DURATION'],
      priority: 6,
      confidence: 0.85,
      canAutoFix: (error: ValidationError, slide: PPTXSlide): boolean => {
        return error.code === 'INVALID_DURATION' && slide.duration <= 0;
      },
      applyFix: (error: ValidationError, slide: PPTXSlide): PPTXSlide => {
        const corrected = { ...slide };
        
        // Calcular duração baseada no conteúdo
        let estimatedDuration = 3; // Duração mínima
        
        if (slide.content) {
          // ~200 palavras por minuto de leitura
          const wordCount = slide.content.split(/\s+/).length;
          const readingTime = Math.ceil(wordCount / 3.33); // palavras por segundo
          estimatedDuration = Math.max(estimatedDuration, readingTime);
        }
        
        if (slide.images && slide.images.length > 0) {
          // Adicionar tempo para visualização de imagens
          estimatedDuration += slide.images.length * 2;
        }
        
        // Limitar duração máxima
        corrected.duration = Math.min(estimatedDuration, 30);
        
        return corrected;
      }
    });

    // Regra: Correção de texto alternativo ausente
    this.rules.set('missing_alt_text_fix', {
      name: 'Correção de Texto Alternativo',
      description: 'Gera texto alternativo para imagens sem descrição',
      errorCodes: ['MISSING_ALT_TEXT'],
      priority: 7,
      confidence: 0.75,
      canAutoFix: (error: ValidationError, slide: PPTXSlide): boolean => {
        return error.code === 'MISSING_ALT_TEXT' && 
               slide.images && slide.images.length > 0;
      },
      applyFix: (error: ValidationError, slide: PPTXSlide): PPTXSlide => {
        const corrected = { ...slide };
        
        corrected.images = corrected.images?.map((image, index) => {
          const correctedImage = { ...image };
          
          if (!correctedImage.alt || correctedImage.alt.trim().length === 0) {
            // Tentar gerar descrição baseada no contexto
            if (slide.title) {
              correctedImage.alt = `Imagem relacionada a: ${slide.title}`;
            } else if (slide.content) {
              const firstWords = slide.content.split(' ').slice(0, 5).join(' ');
              correctedImage.alt = `Imagem do slide: ${firstWords}...`;
            } else {
              correctedImage.alt = `Imagem ${index + 1} do slide`;
            }
          }
          
          return correctedImage;
        }) || [];
        
        return corrected;
      }
    });

    // Regra: Correção de layout ausente
    this.rules.set('missing_layout_fix', {
      name: 'Correção de Layout',
      description: 'Define layout padrão baseado no conteúdo do slide',
      errorCodes: ['MISSING_LAYOUT'],
      priority: 5,
      confidence: 0.8,
      canAutoFix: (error: ValidationError, slide: PPTXSlide): boolean => {
        return error.code === 'MISSING_LAYOUT' && 
               (!slide.layout || slide.layout.trim().length === 0);
      },
      applyFix: (error: ValidationError, slide: PPTXSlide): PPTXSlide => {
        const corrected = { ...slide };
        
        // Determinar layout baseado no conteúdo
        if (slide.images && slide.images.length > 0) {
          if (slide.content && slide.content.length > 100) {
            corrected.layout = 'content-with-image';
          } else {
            corrected.layout = 'image-focused';
          }
        } else if (slide.content && slide.content.length > 200) {
          corrected.layout = 'text-heavy';
        } else if (slide.title && slide.content) {
          corrected.layout = 'title-and-content';
        } else {
          corrected.layout = 'default';
        }
        
        return corrected;
      }
    });
  }

  // Encontrar regra para um erro específico
  private findRuleForError(error: ValidationError): CorrectionRule | undefined {
    for (const rule of this.rules.values()) {
      if (rule.errorCodes.includes(error.code)) {
        return rule;
      }
    }
    return undefined;
  }

  // Obter valor de um campo do slide
  private getFieldValue(slide: PPTXSlide, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let value: any = slide;
    
    for (const part of parts) {
      if (part.includes('[') && part.includes(']')) {
        const [arrayName, indexStr] = part.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        value = value[arrayName]?.[index];
      } else {
        value = value[part];
      }
      
      if (value === undefined) break;
    }
    
    return value;
  }

  // Restaurar slide do backup
  public restoreSlide(slideId: string): PPTXSlide | null {
    return this.backups.get(slideId) || null;
  }

  // Limpar backups
  public clearBackups(): void {
    this.backups.clear();
  }

  // Obter estatísticas
  public getStats(): CorrectionStats {
    return { 
      ...this.stats,
      correctionsByType: new Map(this.stats.correctionsByType)
    };
  }

  // Atualizar configuração
  public updateConfig(newConfig: Partial<CorrectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Adicionar regra customizada
  public addCustomRule(rule: CorrectionRule): void {
    this.rules.set(rule.name, rule);
  }

  // Remover regra
  public removeRule(ruleName: string): void {
    this.rules.delete(ruleName);
  }

  // Resetar estatísticas
  public resetStats(): void {
    this.stats = {
      totalCorrections: 0,
      successfulCorrections: 0,
      failedCorrections: 0,
      averageConfidence: 0,
      processingTime: 0,
      correctionsByType: new Map()
    };
  }
}

// Utilitários para correção
export const CorrectionUtils = {
  // Gerar ID único
  generateUniqueId: (prefix: string = 'item'): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  },

  // Sanitizar texto
  sanitizeText: (text: string): string => {
    return text.replace(/[<>"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;'
      };
      return entities[match] || match;
    }).trim();
  },

  // Validar e corrigir cor
  fixColor: (color: string): string => {
    // Remover espaços e converter para minúsculas
    const cleanColor = color.trim().toLowerCase();
    
    // Se já é uma cor válida, retornar
    if (/^#([a-f0-9]{3}|[a-f0-9]{6})$/.test(cleanColor)) {
      return cleanColor;
    }
    
    // Tentar corrigir cores nomeadas comuns
    const namedColors: { [key: string]: string } = {
      'red': '#ff0000',
      'green': '#008000',
      'blue': '#0000ff',
      'black': '#000000',
      'white': '#ffffff',
      'gray': '#808080',
      'yellow': '#ffff00'
    };
    
    return namedColors[cleanColor] || '#000000'; // Preto como padrão
  },

  // Calcular duração baseada no conteúdo
  calculateContentDuration: (content: string, images: number = 0): number => {
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 3.33); // ~200 palavras por minuto
    const imageTime = images * 2; // 2 segundos por imagem
    
    return Math.max(3, Math.min(30, readingTime + imageTime));
  },

  // Gerar texto alternativo inteligente
  generateSmartAltText: (context: {
    slideTitle?: string;
    slideContent?: string;
    imageIndex: number;
    totalImages: number;
  }): string => {
    const { slideTitle, slideContent, imageIndex, totalImages } = context;
    
    if (slideTitle) {
      return `Imagem ${imageIndex + 1} de ${totalImages}: ${slideTitle}`;
    }
    
    if (slideContent) {
      const firstWords = slideContent.split(' ').slice(0, 8).join(' ');
      return `Imagem relacionada a: ${firstWords}${slideContent.length > firstWords.length ? '...' : ''}`;
    }
    
    return `Imagem ${imageIndex + 1} do slide`;
  }
};

// Exportar tipos
export type {
  CorrectionRule,
  CorrectionResult,
  AppliedFix,
  CorrectionConfig,
  CorrectionStats
};