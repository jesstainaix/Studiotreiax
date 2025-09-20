import { PPTXSlideManager } from './pptx-slide-manager.js';

export class PPTXTemplateManager {
  constructor() {
    this.slideManager = new PPTXSlideManager();
    this.templates = new Map();
    
    // Inicializar templates padrão
    this.initializeDefaultTemplates();
  }

  initializeDefaultTemplates() {
    // Template de título
    this.registerTemplate('title', {
      layout: 'title',
      background: { type: 'solid', color: '#FFFFFF' },
      elements: [
        { type: 'title', position: 'center', size: 'large' }
      ]
    });

    // Template de conteúdo
    this.registerTemplate('content', {
      layout: 'content',
      background: { type: 'solid', color: '#FFFFFF' },
      elements: [
        { type: 'title', position: 'top', size: 'medium' },
        { type: 'content', position: 'center', size: 'medium' }
      ]
    });

    // Template de duas colunas
    this.registerTemplate('two-columns', {
      layout: 'two-columns',
      background: { type: 'solid', color: '#FFFFFF' },
      elements: [
        { type: 'title', position: 'top', size: 'medium' },
        { type: 'content', position: 'left', size: 'medium' },
        { type: 'content', position: 'right', size: 'medium' }
      ]
    });

    // Template de comparação
    this.registerTemplate('comparison', {
      layout: 'comparison',
      background: { type: 'solid', color: '#FFFFFF' },
      elements: [
        { type: 'title', position: 'top', size: 'medium' },
        { type: 'content', position: 'left', size: 'medium', label: 'Antes' },
        { type: 'content', position: 'right', size: 'medium', label: 'Depois' }
      ]
    });

    // Template de galeria de imagens
    this.registerTemplate('image-gallery', {
      layout: 'grid',
      background: { type: 'solid', color: '#FFFFFF' },
      elements: [
        { type: 'title', position: 'top', size: 'medium' },
        { type: 'image-grid', position: 'center', columns: 3, rows: 2 }
      ]
    });
  }

  registerTemplate(name, template) {
    this.templates.set(name, {
      ...template,
      id: name,
      createdAt: new Date().toISOString()
    });
  }

  getTemplate(name) {
    return this.templates.get(name);
  }

  listTemplates() {
    return Array.from(this.templates.values());
  }

  async createSlideFromTemplate(templateName, data) {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" não encontrado`);
    }

    // Mapear dados para o template
    const slideOptions = this.mapDataToTemplate(template, data);
    
    // Criar slide usando o gerenciador de slides
    return await this.slideManager.createSlide(slideOptions);
  }

  mapDataToTemplate(template, data) {
    const slideOptions = {
      layout: template.layout,
      background: template.background,
      content: []
    };

    // Mapear elementos do template para o conteúdo do slide
    template.elements.forEach((element, index) => {
      const elementData = data[element.type] || data[index] || {};
      
      switch (element.type) {
        case 'title':
          slideOptions.title = elementData.text || '';
          break;
          
        case 'content':
          if (elementData.text) {
            slideOptions.content.push({
              type: 'text',
              text: elementData.text,
              position: element.position,
              size: element.size
            });
          }
          break;
          
        case 'image-grid':
          if (Array.isArray(elementData.images)) {
            elementData.images.forEach(image => {
              slideOptions.content.push({
                type: 'image',
                src: image.src,
                position: this.calculateGridPosition(image.index, element)
              });
            });
          }
          break;
      }
    });

    return slideOptions;
  }

  calculateGridPosition(index, gridElement) {
    const { columns, rows } = gridElement;
    const column = index % columns;
    const row = Math.floor(index / columns);
    
    // Calcular posição em coordenadas do slide
    return {
      x: (column * (100 / columns)) + '%',
      y: (row * (100 / rows)) + '%'
    };
  }

  // Métodos auxiliares para personalização de templates
  customizeTemplate(templateName, customizations) {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" não encontrado`);
    }

    const customizedTemplate = {
      ...template,
      ...customizations,
      id: `${templateName}-custom-${Date.now()}`
    };

    this.registerTemplate(customizedTemplate.id, customizedTemplate);
    return customizedTemplate.id;
  }

  async applyTemplateToSlide(slideId, templateName, data) {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" não encontrado`);
    }

    // Aplicar template a um slide existente
    const slideOptions = this.mapDataToTemplate(template, data);
    await this.slideManager.updateSlide(null, slideId, slideOptions);
  }
}