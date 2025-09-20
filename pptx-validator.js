// Definição de erros personalizados
export class PPTXError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'PPTXError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends PPTXError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ProcessingError extends PPTXError {
  constructor(message, details = {}) {
    super(message, 'PROCESSING_ERROR', details);
    this.name = 'ProcessingError';
  }
}

// Classe de validação
export class PPTXValidator {
  static validateSlideContent(content) {
    const errors = [];

    if (!content || typeof content !== 'object') {
      throw new ValidationError('Conteúdo do slide inválido');
    }

    // Validar título
    if (content.title && typeof content.title !== 'string') {
      errors.push('Título deve ser uma string');
    }

    // Validar elementos de conteúdo
    if (content.content) {
      if (!Array.isArray(content.content)) {
        errors.push('Conteúdo deve ser um array');
      } else {
        content.content.forEach((item, index) => {
          try {
            this.validateContentItem(item);
          } catch (error) {
            errors.push(`Item ${index}: ${error.message}`);
          }
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validação de conteúdo falhou', { errors });
    }
  }

  static validateContentItem(item) {
    if (!item.type) {
      throw new ValidationError('Tipo de conteúdo não especificado');
    }

    switch (item.type) {
      case 'text':
        if (!item.text || typeof item.text !== 'string') {
          throw new ValidationError('Texto inválido');
        }
        break;

      case 'image':
        if (!item.src || typeof item.src !== 'string') {
          throw new ValidationError('Fonte da imagem inválida');
        }
        break;

      case 'table':
        if (!Array.isArray(item.data)) {
          throw new ValidationError('Dados da tabela inválidos');
        }
        break;

      case 'chart':
        if (!item.data || typeof item.data !== 'object') {
          throw new ValidationError('Dados do gráfico inválidos');
        }
        if (!item.chartType) {
          throw new ValidationError('Tipo de gráfico não especificado');
        }
        break;

      default:
        throw new ValidationError(`Tipo de conteúdo desconhecido: ${item.type}`);
    }
  }

  static validateTemplate(template) {
    const errors = [];

    if (!template || typeof template !== 'object') {
      throw new ValidationError('Template inválido');
    }

    // Validar campos obrigatórios
    const requiredFields = ['layout', 'elements'];
    requiredFields.forEach(field => {
      if (!template[field]) {
        errors.push(`Campo obrigatório ausente: ${field}`);
      }
    });

    // Validar elementos do template
    if (Array.isArray(template.elements)) {
      template.elements.forEach((element, index) => {
        try {
          this.validateTemplateElement(element);
        } catch (error) {
          errors.push(`Elemento ${index}: ${error.message}`);
        }
      });
    } else {
      errors.push('Elements deve ser um array');
    }

    if (errors.length > 0) {
      throw new ValidationError('Validação de template falhou', { errors });
    }
  }

  static validateTemplateElement(element) {
    if (!element.type) {
      throw new ValidationError('Tipo de elemento não especificado');
    }

    const validTypes = ['title', 'content', 'image-grid'];
    if (!validTypes.includes(element.type)) {
      throw new ValidationError(`Tipo de elemento inválido: ${element.type}`);
    }

    if (!element.position) {
      throw new ValidationError('Posição do elemento não especificada');
    }
  }

  static validatePPTXBuffer(buffer) {
    if (!buffer || !(buffer instanceof Buffer)) {
      throw new ValidationError('Buffer PPTX inválido');
    }

    // Verificar assinatura do arquivo PPTX
    const signature = buffer.slice(0, 4).toString('hex');
    if (signature !== '504b0304') { // Assinatura ZIP
      throw new ValidationError('Arquivo PPTX inválido: assinatura incorreta');
    }
  }
}

// Middleware de tratamento de erros
export class PPTXErrorHandler {
  static handleError(error) {
    if (error instanceof PPTXError) {
      console.error(`[${error.code}] ${error.message}`, error.details);
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    }

    // Erros não tratados
    console.error('[UNEXPECTED_ERROR]', error);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: 'Ocorreu um erro inesperado',
        details: { originalError: error.message }
      }
    };
  }

  static async wrapAsync(fn) {
    try {
      const result = await fn();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}