import { PPTXSlide } from './content-extractor';
import { ValidationResult, SlideDataValidator } from './slide-data-validator';

/**
 * Interface para configuração de auto-correção
 */
export interface AutoCorrectionConfig {
  enableTitleGeneration: boolean;
  enableContentInference: boolean;
  enableImageMetadataFix: boolean;
  enableTextCleaning: boolean;
  enableStructureNormalization: boolean;
  maxTitleLength: number;
  minContentLength: number;
}

/**
 * Interface para resultado de auto-correção
 */
export interface CorrectionResult {
  corrected: boolean;
  corrections: string[];
  originalSlide: PPTXSlide;
  correctedSlide: PPTXSlide;
  confidence: number;
}

/**
 * Serviço de auto-correção para dados de slides PPTX
 */
export class AutoCorrectionService {
  private static instance: AutoCorrectionService;
  private config: AutoCorrectionConfig;
  private validator: SlideDataValidator;

  private constructor() {
    this.config = {
      enableTitleGeneration: true,
      enableContentInference: true,
      enableImageMetadataFix: true,
      enableTextCleaning: true,
      enableStructureNormalization: true,
      maxTitleLength: 100,
      minContentLength: 10
    };
    this.validator = SlideDataValidator.getInstance();
  }

  /**
   * Obtém a instância singleton do serviço
   */
  public static getInstance(): AutoCorrectionService {
    if (!AutoCorrectionService.instance) {
      AutoCorrectionService.instance = new AutoCorrectionService();
    }
    return AutoCorrectionService.instance;
  }

  /**
   * Configura o serviço de auto-correção
   */
  public configure(config: Partial<AutoCorrectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Aplica auto-correção em um slide individual
   */
  public correctSlide(slide: PPTXSlide, slideIndex: number): CorrectionResult {
    
    const originalSlide = JSON.parse(JSON.stringify(slide)) as PPTXSlide;
    const correctedSlide = JSON.parse(JSON.stringify(slide)) as PPTXSlide;
    const corrections: string[] = [];
    let confidence = 1.0;

    // 1. Correção de título
    if (this.config.enableTitleGeneration) {
      const titleResult = this.correctTitle(correctedSlide, slideIndex);
      if (titleResult.corrected) {
        corrections.push(...titleResult.corrections);
        confidence *= titleResult.confidence;
      }
    }

    // 2. Correção de conteúdo
    if (this.config.enableContentInference) {
      const contentResult = this.correctContent(correctedSlide, slideIndex);
      if (contentResult.corrected) {
        corrections.push(...contentResult.corrections);
        confidence *= contentResult.confidence;
      }
    }

    // 3. Correção de metadados de imagem
    if (this.config.enableImageMetadataFix) {
      const imageResult = this.correctImageMetadata(correctedSlide, slideIndex);
      if (imageResult.corrected) {
        corrections.push(...imageResult.corrections);
        confidence *= imageResult.confidence;
      }
    }

    // 4. Limpeza de texto
    if (this.config.enableTextCleaning) {
      const textResult = this.cleanText(correctedSlide, slideIndex);
      if (textResult.corrected) {
        corrections.push(...textResult.corrections);
        confidence *= textResult.confidence;
      }
    }

    // 5. Normalização de estrutura
    if (this.config.enableStructureNormalization) {
      const structureResult = this.normalizeStructure(correctedSlide, slideIndex);
      if (structureResult.corrected) {
        corrections.push(...structureResult.corrections);
        confidence *= structureResult.confidence;
      }
    }

    const corrected = corrections.length > 0;
    
    if (corrected) {
    }

    return {
      corrected,
      corrections,
      originalSlide,
      correctedSlide,
      confidence: Math.max(0.1, confidence)
    };
  }

  /**
   * Corrige título ausente ou malformado
   */
  private correctTitle(slide: PPTXSlide, slideIndex: number): CorrectionResult {
    const corrections: string[] = [];
    let confidence = 1.0;

    if (!slide.title || slide.title.trim().length === 0) {
      // Tentar gerar título a partir do conteúdo
      let generatedTitle = '';
      
      if (slide.content && slide.content.trim().length > 0) {
        // Usar as primeiras palavras do conteúdo
        const words = slide.content.trim().split(/\s+/);
        generatedTitle = words.slice(0, 8).join(' ');
        confidence = 0.7;
      } else if (slide.textContent && slide.textContent.length > 0) {
        // Usar o primeiro item de texto
        generatedTitle = slide.textContent[0].substring(0, 50);
        confidence = 0.6;
      } else if (slide.bulletPoints && slide.bulletPoints.length > 0) {
        // Usar o primeiro bullet point
        generatedTitle = slide.bulletPoints[0].substring(0, 50);
        confidence = 0.5;
      } else {
        // Título genérico
        generatedTitle = `Slide ${slideIndex + 1}`;
        confidence = 0.3;
      }

      // Limitar o comprimento do título
      if (generatedTitle.length > this.config.maxTitleLength) {
        generatedTitle = generatedTitle.substring(0, this.config.maxTitleLength - 3) + '...';
      }

      slide.title = generatedTitle;
      corrections.push(`Título gerado: "${generatedTitle}"`);
    } else {
      // Limpar título existente
      const originalTitle = slide.title;
      slide.title = this.cleanTextContent(slide.title);
      
      if (slide.title !== originalTitle) {
        corrections.push('Título limpo e formatado');
        confidence = 0.9;
      }
    }

    return {
      corrected: corrections.length > 0,
      corrections,
      originalSlide: slide,
      correctedSlide: slide,
      confidence
    };
  }

  /**
   * Corrige conteúdo ausente ou insuficiente
   */
  private correctContent(slide: PPTXSlide, slideIndex: number): CorrectionResult {
    const corrections: string[] = [];
    let confidence = 1.0;

    const hasContent = slide.content && slide.content.trim().length >= this.config.minContentLength;
    const hasTextContent = slide.textContent && slide.textContent.length > 0;
    const hasBulletPoints = slide.bulletPoints && slide.bulletPoints.length > 0;

    if (!hasContent && !hasTextContent && !hasBulletPoints) {
      // Tentar inferir conteúdo a partir de outros elementos
      if (slide.images && slide.images.length > 0) {
        slide.content = `Este slide contém ${slide.images.length} imagem(ns).`;
        corrections.push('Conteúdo inferido a partir de imagens');
        confidence = 0.4;
      } else if (slide.shapes && slide.shapes.length > 0) {
        slide.content = `Este slide contém ${slide.shapes.length} elemento(s) gráfico(s).`;
        corrections.push('Conteúdo inferido a partir de formas');
        confidence = 0.3;
      } else {
        slide.content = 'Conteúdo não disponível.';
        corrections.push('Conteúdo padrão adicionado');
        confidence = 0.2;
      }
    }

    // Consolidar conteúdo fragmentado
    if (slide.textContent && slide.textContent.length > 0 && (!slide.content || slide.content.length < this.config.minContentLength)) {
      slide.content = slide.textContent.join(' ');
      corrections.push('Conteúdo consolidado a partir de fragmentos de texto');
      confidence = 0.8;
    }

    return {
      corrected: corrections.length > 0,
      corrections,
      originalSlide: slide,
      correctedSlide: slide,
      confidence
    };
  }

  /**
   * Corrige metadados de imagens
   */
  private correctImageMetadata(slide: PPTXSlide, slideIndex: number): CorrectionResult {
    const corrections: string[] = [];
    let confidence = 1.0;

    if (slide.images && slide.images.length > 0) {
      slide.images.forEach((image, imgIndex) => {
        // Corrigir URL vazia
        if (!image.url || image.url.trim().length === 0) {
          image.url = `placeholder-image-${slideIndex + 1}-${imgIndex + 1}.png`;
          corrections.push(`URL de imagem ${imgIndex + 1} corrigida`);
          confidence *= 0.5;
        }

        // Adicionar texto alternativo
        if (!image.alt || image.alt.trim().length === 0) {
          image.alt = `Imagem ${imgIndex + 1} do slide ${slideIndex + 1}`;
          corrections.push(`Texto alternativo adicionado para imagem ${imgIndex + 1}`);
          confidence *= 0.9;
        }

        // Definir posição padrão
        if (!image.position) {
          image.position = {
            x: 0,
            y: 0,
            width: 300,
            height: 200
          };
          corrections.push(`Posição padrão definida para imagem ${imgIndex + 1}`);
          confidence *= 0.8;
        }

        // Definir dimensões padrão se ausentes
        if (!image.width || !image.height) {
          image.width = image.width || 300;
          image.height = image.height || 200;
          corrections.push(`Dimensões padrão definidas para imagem ${imgIndex + 1}`);
          confidence *= 0.9;
        }
      });
    }

    return {
      corrected: corrections.length > 0,
      corrections,
      originalSlide: slide,
      correctedSlide: slide,
      confidence
    };
  }

  /**
   * Limpa e normaliza texto
   */
  private cleanText(slide: PPTXSlide, slideIndex: number): CorrectionResult {
    const corrections: string[] = [];
    const confidence = 1.0;

    // Limpar título
    if (slide.title) {
      const originalTitle = slide.title;
      slide.title = this.cleanTextContent(slide.title);
      if (slide.title !== originalTitle) {
        corrections.push('Título limpo');
      }
    }

    // Limpar conteúdo
    if (slide.content) {
      const originalContent = slide.content;
      slide.content = this.cleanTextContent(slide.content);
      if (slide.content !== originalContent) {
        corrections.push('Conteúdo limpo');
      }
    }

    // Limpar array de texto
    if (slide.textContent && slide.textContent.length > 0) {
      const originalLength = slide.textContent.length;
      slide.textContent = slide.textContent
        .map(text => this.cleanTextContent(text))
        .filter(text => text.length > 0);
      
      if (slide.textContent.length !== originalLength) {
        corrections.push('Array de texto limpo e filtrado');
      }
    }

    // Limpar bullet points
    if (slide.bulletPoints && slide.bulletPoints.length > 0) {
      const originalLength = slide.bulletPoints.length;
      slide.bulletPoints = slide.bulletPoints
        .map(bp => this.cleanTextContent(bp))
        .filter(bp => bp.length > 0);
      
      if (slide.bulletPoints.length !== originalLength) {
        corrections.push('Bullet points limpos e filtrados');
      }
    }

    return {
      corrected: corrections.length > 0,
      corrections,
      originalSlide: slide,
      correctedSlide: slide,
      confidence
    };
  }

  /**
   * Normaliza a estrutura do slide
   */
  private normalizeStructure(slide: PPTXSlide, slideIndex: number): CorrectionResult {
    const corrections: string[] = [];
    const confidence = 1.0;

    // Garantir que arrays existam
    if (!slide.textContent) {
      slide.textContent = [];
      corrections.push('Array textContent inicializado');
    }

    if (!slide.bulletPoints) {
      slide.bulletPoints = [];
      corrections.push('Array bulletPoints inicializado');
    }

    if (!slide.images) {
      slide.images = [];
      corrections.push('Array images inicializado');
    }

    if (!slide.shapes) {
      slide.shapes = [];
      corrections.push('Array shapes inicializado');
    }

    // Adicionar ID único se ausente
    if (!slide.id) {
      slide.id = `slide-${slideIndex + 1}-${Date.now()}`;
      corrections.push('ID único adicionado');
    }

    // Adicionar número do slide
    if (slide.slideNumber === undefined || slide.slideNumber === null) {
      slide.slideNumber = slideIndex + 1;
      corrections.push('Número do slide adicionado');
    }

    return {
      corrected: corrections.length > 0,
      corrections,
      originalSlide: slide,
      correctedSlide: slide,
      confidence
    };
  }

  /**
   * Limpa conteúdo de texto removendo caracteres indesejados
   */
  private cleanTextContent(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalizar espaços
      .replace(/[\r\n]+/g, ' ') // Remover quebras de linha
      .replace(/[^\w\s\p{P}]/gu, '') // Remover caracteres especiais, mantendo pontuação
      .trim();
  }

  /**
   * Aplica auto-correção em um array de slides
   */
  public correctSlides(slides: PPTXSlide[]): {
    correctedSlides: PPTXSlide[];
    corrections: string[];
    overallConfidence: number;
  } {
    
    const correctedSlides: PPTXSlide[] = [];
    const allCorrections: string[] = [];
    let totalConfidence = 0;
    let correctedCount = 0;

    slides.forEach((slide, index) => {
      const result = this.correctSlide(slide, index);
      correctedSlides.push(result.correctedSlide);
      
      if (result.corrected) {
        allCorrections.push(`Slide ${index + 1}: ${result.corrections.join(', ')}`);
        totalConfidence += result.confidence;
        correctedCount++;
      } else {
        totalConfidence += 1.0; // Slide perfeito
      }
    });

    const overallConfidence = slides.length > 0 ? totalConfidence / slides.length : 0;

    return {
      correctedSlides,
      corrections: allCorrections,
      overallConfidence
    };
  }

  /**
   * Valida e corrige slides em uma única operação
   */
  public validateAndCorrect(slides: PPTXSlide[]): {
    validationResult: ValidationResult;
    correctionResult: {
      correctedSlides: PPTXSlide[];
      corrections: string[];
      overallConfidence: number;
    };
    finalValidation: ValidationResult;
  } {
    
    // Validação inicial
    const initialValidation = this.validator.validateSlides(slides);

    // Auto-correção
    const correctionResult = this.correctSlides(slides);
    
    // Validação final
    const finalValidation = this.validator.validateSlides(correctionResult.correctedSlides);

    return {
      validationResult: initialValidation,
      correctionResult,
      finalValidation
    };
  }
}

/**
 * Função utilitária para auto-correção rápida
 */
export function autoCorrectSlides(
  slides: PPTXSlide[], 
  config?: Partial<AutoCorrectionConfig>
): PPTXSlide[] {
  const service = AutoCorrectionService.getInstance();
  
  if (config) {
    service.configure(config);
  }
  
  return service.correctSlides(slides).correctedSlides;
}

/**
 * Função utilitária para validação e correção integrada
 */
export function validateAndAutoCorrect(
  slides: PPTXSlide[], 
  config?: Partial<AutoCorrectionConfig>
) {
  const service = AutoCorrectionService.getInstance();
  
  if (config) {
    service.configure(config);
  }
  
  return service.validateAndCorrect(slides);
}