import { PPTXSlide } from './content-extractor';

/**
 * Interface para resultados de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingData: string[];
  extractedElements: {
    titles: number;
    textContent: number;
    images: number;
    bulletPoints: number;
    shapes: number;
  };
}

/**
 * Interface para configuração de validação
 */
export interface ValidationConfig {
  requireTitle: boolean;
  requireContent: boolean;
  requireImages: boolean;
  minTextLength: number;
  maxTextLength: number;
  allowEmptySlides: boolean;
}

/**
 * Classe para validação de dados extraídos de slides PPTX
 */
export class SlideDataValidator {
  private static instance: SlideDataValidator;
  private config: ValidationConfig;

  private constructor() {
    this.config = {
      requireTitle: true,
      requireContent: false,
      requireImages: false,
      minTextLength: 1,
      maxTextLength: 5000,
      allowEmptySlides: false
    };
  }

  /**
   * Obtém a instância singleton do validador
   */
  public static getInstance(): SlideDataValidator {
    if (!SlideDataValidator.instance) {
      SlideDataValidator.instance = new SlideDataValidator();
    }
    return SlideDataValidator.instance;
  }

  /**
   * Configura as regras de validação
   */
  public configure(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Valida um slide individual
   */
  public validateSlide(slide: PPTXSlide, slideIndex: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingData: string[] = [];

    // Validação do título
    if (this.config.requireTitle && (!slide.title || slide.title.trim().length === 0)) {
      errors.push(`Slide ${slideIndex + 1}: Título obrigatório está ausente`);
      missingData.push('title');
    }

    // Validação do conteúdo
    const hasContent = slide.content && slide.content.trim().length > 0;
    const hasTextContent = slide.textContent && slide.textContent.length > 0;
    const hasBulletPoints = slide.bulletPoints && slide.bulletPoints.length > 0;

    if (this.config.requireContent && !hasContent && !hasTextContent && !hasBulletPoints) {
      errors.push(`Slide ${slideIndex + 1}: Conteúdo obrigatório está ausente`);
      missingData.push('content');
    }

    // Validação do comprimento do texto
    const totalTextLength = (slide.content?.length || 0) + 
                           (slide.textContent?.join(' ').length || 0) + 
                           (slide.bulletPoints?.join(' ').length || 0);

    if (totalTextLength < this.config.minTextLength) {
      warnings.push(`Slide ${slideIndex + 1}: Texto muito curto (${totalTextLength} caracteres)`);
    }

    if (totalTextLength > this.config.maxTextLength) {
      warnings.push(`Slide ${slideIndex + 1}: Texto muito longo (${totalTextLength} caracteres)`);
    }

    // Validação de imagens
    if (this.config.requireImages && (!slide.images || slide.images.length === 0)) {
      warnings.push(`Slide ${slideIndex + 1}: Nenhuma imagem encontrada`);
      missingData.push('images');
    }

    // Validação de slide vazio
    const isEmpty = !slide.title && !hasContent && !hasTextContent && 
                   !hasBulletPoints && (!slide.images || slide.images.length === 0);
    
    if (!this.config.allowEmptySlides && isEmpty) {
      errors.push(`Slide ${slideIndex + 1}: Slide completamente vazio`);
    }

    // Contagem de elementos extraídos
    const extractedElements = {
      titles: slide.title ? 1 : 0,
      textContent: slide.textContent?.length || 0,
      images: slide.images?.length || 0,
      bulletPoints: slide.bulletPoints?.length || 0,
      shapes: slide.shapes?.length || 0
    };

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      missingData,
      extractedElements
    };
  }

  /**
   * Valida um array de slides
   */
  public validateSlides(slides: PPTXSlide[]): ValidationResult {

    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const allMissingData: string[] = [];
    const totalElements = {
      titles: 0,
      textContent: 0,
      images: 0,
      bulletPoints: 0,
      shapes: 0
    };

    // Validar cada slide individualmente
    slides.forEach((slide, index) => {
      const result = this.validateSlide(slide, index);
      
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      allMissingData.push(...result.missingData);
      
      totalElements.titles += result.extractedElements.titles;
      totalElements.textContent += result.extractedElements.textContent;
      totalElements.images += result.extractedElements.images;
      totalElements.bulletPoints += result.extractedElements.bulletPoints;
      totalElements.shapes += result.extractedElements.shapes;
    });

    // Validações globais
    if (slides.length === 0) {
      allErrors.push('Nenhum slide foi extraído do documento');
    }

    if (totalElements.titles === 0) {
      allWarnings.push('Nenhum título foi extraído de todos os slides');
    }

    if (totalElements.textContent === 0 && totalElements.bulletPoints === 0) {
      allWarnings.push('Nenhum conteúdo de texto foi extraído');
    }

    const isValid = allErrors.length === 0;

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
      missingData: [...new Set(allMissingData)], // Remove duplicatas
      extractedElements: totalElements
    };
  }

  /**
   * Valida o mapeamento de dados para elementos div
   */
  public validateDivMapping(slides: PPTXSlide[]): ValidationResult {

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingData: string[] = [];

    slides.forEach((slide, index) => {
      // Verificar se os dados essenciais estão presentes para renderização
      if (!slide.title && !slide.content && !slide.textContent?.length) {
        errors.push(`Slide ${index + 1}: Sem dados suficientes para renderização em div`);
        missingData.push('renderableContent');
      }

      // Verificar se as imagens têm URLs válidas
      if (slide.images) {
        slide.images.forEach((image, imgIndex) => {
          if (!image.url || image.url.trim().length === 0) {
            warnings.push(`Slide ${index + 1}, Imagem ${imgIndex + 1}: URL da imagem está vazia`);
          }
          
          if (!image.alt) {
            warnings.push(`Slide ${index + 1}, Imagem ${imgIndex + 1}: Texto alternativo ausente`);
          }

          if (!image.position) {
            warnings.push(`Slide ${index + 1}, Imagem ${imgIndex + 1}: Posição da imagem não definida`);
          }
        });
      }

      // Verificar se os bullet points estão estruturados
      if (slide.bulletPoints && slide.bulletPoints.some(bp => !bp || bp.trim().length === 0)) {
        warnings.push(`Slide ${index + 1}: Alguns bullet points estão vazios`);
      }
    });

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      missingData,
      extractedElements: {
        titles: 0,
        textContent: 0,
        images: 0,
        bulletPoints: 0,
        shapes: 0
      }
    };
  }

  /**
   * Gera um relatório detalhado de validação
   */
  public generateValidationReport(slides: PPTXSlide[]): string {
    const generalResult = this.validateSlides(slides);
    const divMappingResult = this.validateDivMapping(slides);

    let report = '📋 RELATÓRIO DE VALIDAÇÃO DE EXTRAÇÃO PPTX\n';
    report += '='.repeat(50) + '\n\n';

    report += `📊 ESTATÍSTICAS GERAIS:\n`;
    report += `- Total de slides: ${slides.length}\n`;
    report += `- Títulos extraídos: ${generalResult.extractedElements.titles}\n`;
    report += `- Conteúdos de texto: ${generalResult.extractedElements.textContent}\n`;
    report += `- Imagens extraídas: ${generalResult.extractedElements.images}\n`;
    report += `- Bullet points: ${generalResult.extractedElements.bulletPoints}\n`;
    report += `- Formas/Shapes: ${generalResult.extractedElements.shapes}\n\n`;

    if (generalResult.errors.length > 0) {
      report += `❌ ERROS (${generalResult.errors.length}):\n`;
      generalResult.errors.forEach(error => {
        report += `- ${error}\n`;
      });
      report += '\n';
    }

    if (generalResult.warnings.length > 0) {
      report += `⚠️ AVISOS (${generalResult.warnings.length}):\n`;
      generalResult.warnings.forEach(warning => {
        report += `- ${warning}\n`;
      });
      report += '\n';
    }

    if (divMappingResult.errors.length > 0 || divMappingResult.warnings.length > 0) {
      report += `🎯 MAPEAMENTO PARA DIV:\n`;
      divMappingResult.errors.forEach(error => {
        report += `❌ ${error}\n`;
      });
      divMappingResult.warnings.forEach(warning => {
        report += `⚠️ ${warning}\n`;
      });
      report += '\n';
    }

    if (generalResult.missingData.length > 0) {
      report += `📋 DADOS AUSENTES:\n`;
      [...new Set(generalResult.missingData)].forEach(missing => {
        report += `- ${missing}\n`;
      });
      report += '\n';
    }

    const overallValid = generalResult.isValid && divMappingResult.isValid;
    report += `🎯 RESULTADO GERAL: ${overallValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`;
    return report;
  }
}

/**
 * Função utilitária para validação rápida
 */
export function validateSlideExtraction(slides: PPTXSlide[], config?: Partial<ValidationConfig>): ValidationResult {
  const validator = SlideDataValidator.getInstance();
  
  if (config) {
    validator.configure(config);
  }
  
  return validator.validateSlides(slides);
}

/**
 * Função utilitária para gerar relatório rápido
 */
export function generateExtractionReport(slides: PPTXSlide[], config?: Partial<ValidationConfig>): string {
  const validator = SlideDataValidator.getInstance();
  
  if (config) {
    validator.configure(config);
  }
  
  return validator.generateValidationReport(slides);
}