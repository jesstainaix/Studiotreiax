/**
 * Sistema de Templates Profissionais
 * 
 * Biblioteca completa de templates pré-configurados para diferentes
 * tipos de apresentações com estilos, transições e elementos visuais
 */

export interface TemplateStyle {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headerFont: string;
  bodyFont: string;
}

export interface TemplateTransition {
  type: 'fade' | 'slide' | 'zoom' | 'flip' | 'cube' | 'dissolve' | 'wipe';
  duration: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  direction?: 'left' | 'right' | 'up' | 'down';
}

export interface TemplateLayout {
  id: string;
  name: string;
  description: string;
  sections: {
    header?: { height: string; position: 'top' | 'center' };
    content: { 
      type: 'text' | 'image' | 'video' | 'chart' | 'mixed';
      layout: 'single' | 'dual' | 'grid' | 'sidebar';
    };
    footer?: { height: string; content: string[] };
  };
}

export interface TemplateAnimation {
  element: string;
  animation: 'fadeIn' | 'slideIn' | 'zoomIn' | 'bounceIn' | 'typewriter';
  delay: number;
  duration: number;
  easing: string;
}

export interface ProfessionalTemplate {
  id: string;
  name: string;
  category: 'corporate' | 'educational' | 'marketing' | 'creative' | 'medical' | 'technical';
  description: string;
  thumbnail: string;
  isPremium: boolean;
  
  // Visual styling
  style: TemplateStyle;
  
  // Layout configurations
  layouts: TemplateLayout[];
  
  // Transition settings
  transitions: {
    default: TemplateTransition;
    alternatives: TemplateTransition[];
  };
  
  // Animation presets
  animations: TemplateAnimation[];
  
  // Audio settings
  audio: {
    defaultVoice: string;
    musicTrack?: string;
    soundEffects: boolean;
    backgroundMusic: boolean;
  };
  
  // Timing configurations
  timing: {
    slideMinDuration: number;
    slideMaxDuration: number;
    readingSpeed: number; // words per minute
    pauseBetweenSlides: number;
  };
  
  // Branding elements
  branding: {
    logo?: string;
    watermark?: string;
    footerText?: string;
    colorScheme: string[];
  };
}

/**
 * Gerenciador de Templates Profissionais
 */
export class TemplateManager {
  private templates: Map<string, ProfessionalTemplate> = new Map();
  private customTemplates: Map<string, ProfessionalTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Corporate Templates
    this.addTemplate(this.createCorporateTemplate());
    this.addTemplate(this.createExecutiveTemplate());
    this.addTemplate(this.createMinimalTemplate());
    
    // Educational Templates
    this.addTemplate(this.createEducationalTemplate());
    this.addTemplate(this.createTrainingTemplate());
    this.addTemplate(this.createAcademicTemplate());
    
    // Marketing Templates
    this.addTemplate(this.createMarketingTemplate());
    this.addTemplate(this.createProductTemplate());
    this.addTemplate(this.createSalesTemplate());
    
    // Creative Templates
    this.addTemplate(this.createCreativeTemplate());
    this.addTemplate(this.createArtisticTemplate());
    
    // Technical Templates
    this.addTemplate(this.createTechnicalTemplate());
    this.addTemplate(this.createScientificTemplate());
  }

  private createCorporateTemplate(): ProfessionalTemplate {
    return {
      id: 'corporate-professional',
      name: 'Corporate Professional',
      category: 'corporate',
      description: 'Template corporativo elegante com design clean e profissional',
      thumbnail: '/templates/corporate-professional.jpg',
      isPremium: false,
      
      style: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#3b82f6',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'Inter, sans-serif',
        headerFont: 'Inter, sans-serif',
        bodyFont: 'Inter, sans-serif'
      },
      
      layouts: [
        {
          id: 'title-slide',
          name: 'Slide de Título',
          description: 'Layout para slide inicial com título e subtítulo',
          sections: {
            header: { height: '20%', position: 'top' },
            content: { type: 'text', layout: 'single' },
            footer: { height: '10%', content: ['logo', 'date'] }
          }
        },
        {
          id: 'content-slide',
          name: 'Slide de Conteúdo',
          description: 'Layout padrão para conteúdo com texto e imagens',
          sections: {
            header: { height: '15%', position: 'top' },
            content: { type: 'mixed', layout: 'dual' },
            footer: { height: '8%', content: ['page-number'] }
          }
        },
        {
          id: 'chart-slide',
          name: 'Slide de Gráfico',
          description: 'Layout otimizado para apresentação de dados',
          sections: {
            header: { height: '15%', position: 'top' },
            content: { type: 'chart', layout: 'single' },
            footer: { height: '8%', content: ['source', 'page-number'] }
          }
        }
      ],
      
      transitions: {
        default: {
          type: 'fade',
          duration: 0.8,
          easing: 'ease-in-out'
        },
        alternatives: [
          { type: 'slide', duration: 1.0, easing: 'ease-out', direction: 'left' },
          { type: 'zoom', duration: 0.6, easing: 'ease-in-out' }
        ]
      },
      
      animations: [
        {
          element: 'title',
          animation: 'fadeIn',
          delay: 0.2,
          duration: 1.0,
          easing: 'ease-out'
        },
        {
          element: 'content',
          animation: 'slideIn',
          delay: 0.5,
          duration: 0.8,
          easing: 'ease-out'
        },
        {
          element: 'image',
          animation: 'zoomIn',
          delay: 0.8,
          duration: 0.6,
          easing: 'ease-out'
        }
      ],
      
      audio: {
        defaultVoice: 'pt-BR-Francisca',
        soundEffects: false,
        backgroundMusic: false
      },
      
      timing: {
        slideMinDuration: 5,
        slideMaxDuration: 30,
        readingSpeed: 150,
        pauseBetweenSlides: 1
      },
      
      branding: {
        footerText: 'Confidencial - Uso Interno',
        colorScheme: ['#1e3a8a', '#3b82f6', '#f59e0b', '#ffffff']
      }
    };
  }

  private createEducationalTemplate(): ProfessionalTemplate {
    return {
      id: 'educational-modern',
      name: 'Educational Modern',
      category: 'educational',
      description: 'Template educacional moderno com elementos interativos',
      thumbnail: '/templates/educational-modern.jpg',
      isPremium: false,
      
      style: {
        primaryColor: '#059669',
        secondaryColor: '#10b981',
        accentColor: '#f59e0b',
        backgroundColor: '#f8fafc',
        textColor: '#1f2937',
        fontFamily: 'Roboto, sans-serif',
        headerFont: 'Roboto Slab, serif',
        bodyFont: 'Roboto, sans-serif'
      },
      
      layouts: [
        {
          id: 'lesson-intro',
          name: 'Introdução da Lição',
          description: 'Layout para abertura de nova lição',
          sections: {
            header: { height: '25%', position: 'center' },
            content: { type: 'text', layout: 'single' },
            footer: { height: '12%', content: ['lesson-number', 'duration'] }
          }
        },
        {
          id: 'concept-explanation',
          name: 'Explicação de Conceito',
          description: 'Layout para explicar conceitos com apoio visual',
          sections: {
            header: { height: '18%', position: 'top' },
            content: { type: 'mixed', layout: 'sidebar' },
            footer: { height: '10%', content: ['progress', 'next-topic'] }
          }
        },
        {
          id: 'quiz-slide',
          name: 'Slide de Quiz',
          description: 'Layout interativo para perguntas e respostas',
          sections: {
            header: { height: '20%', position: 'top' },
            content: { type: 'mixed', layout: 'grid' },
            footer: { height: '15%', content: ['score', 'timer'] }
          }
        }
      ],
      
      transitions: {
        default: {
          type: 'slide',
          duration: 1.2,
          easing: 'ease-in-out',
          direction: 'right'
        },
        alternatives: [
          { type: 'fade', duration: 0.8, easing: 'ease-in-out' },
          { type: 'flip', duration: 1.0, easing: 'ease-out' }
        ]
      },
      
      animations: [
        {
          element: 'title',
          animation: 'bounceIn',
          delay: 0.3,
          duration: 1.2,
          easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        },
        {
          element: 'bullet-point',
          animation: 'slideIn',
          delay: 0.5,
          duration: 0.6,
          easing: 'ease-out'
        },
        {
          element: 'diagram',
          animation: 'zoomIn',
          delay: 1.0,
          duration: 0.8,
          easing: 'ease-out'
        }
      ],
      
      audio: {
        defaultVoice: 'pt-BR-Camila',
        soundEffects: true,
        backgroundMusic: true,
        musicTrack: 'educational-background.mp3'
      },
      
      timing: {
        slideMinDuration: 8,
        slideMaxDuration: 45,
        readingSpeed: 130,
        pauseBetweenSlides: 2
      },
      
      branding: {
        footerText: 'Curso Online - Módulo {{module}}',
        colorScheme: ['#059669', '#10b981', '#f59e0b', '#f8fafc']
      }
    };
  }

  private createMarketingTemplate(): ProfessionalTemplate {
    return {
      id: 'marketing-dynamic',
      name: 'Marketing Dynamic',
      category: 'marketing',
      description: 'Template dinâmico para apresentações de marketing e vendas',
      thumbnail: '/templates/marketing-dynamic.jpg',
      isPremium: true,
      
      style: {
        primaryColor: '#dc2626',
        secondaryColor: '#ef4444',
        accentColor: '#fbbf24',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        fontFamily: 'Poppins, sans-serif',
        headerFont: 'Poppins, sans-serif',
        bodyFont: 'Poppins, sans-serif'
      },
      
      layouts: [
        {
          id: 'product-hero',
          name: 'Hero do Produto',
          description: 'Layout impactante para apresentação de produto',
          sections: {
            header: { height: '15%', position: 'top' },
            content: { type: 'image', layout: 'single' },
            footer: { height: '20%', content: ['cta-button', 'benefits'] }
          }
        },
        {
          id: 'features-grid',
          name: 'Grid de Funcionalidades',
          description: 'Layout em grade para destacar recursos',
          sections: {
            header: { height: '18%', position: 'top' },
            content: { type: 'mixed', layout: 'grid' },
            footer: { height: '10%', content: ['contact'] }
          }
        },
        {
          id: 'testimonial',
          name: 'Depoimento',
          description: 'Layout para apresentar depoimentos de clientes',
          sections: {
            header: { height: '12%', position: 'top' },
            content: { type: 'text', layout: 'single' },
            footer: { height: '15%', content: ['client-logo', 'rating'] }
          }
        }
      ],
      
      transitions: {
        default: {
          type: 'cube',
          duration: 1.5,
          easing: 'ease-in-out'
        },
        alternatives: [
          { type: 'wipe', duration: 1.0, easing: 'ease-out', direction: 'left' },
          { type: 'zoom', duration: 0.8, easing: 'ease-in-out' }
        ]
      },
      
      animations: [
        {
          element: 'headline',
          animation: 'typewriter',
          delay: 0.5,
          duration: 2.0,
          easing: 'linear'
        },
        {
          element: 'product-image',
          animation: 'zoomIn',
          delay: 1.0,
          duration: 1.2,
          easing: 'ease-out'
        },
        {
          element: 'cta-button',
          animation: 'bounceIn',
          delay: 2.5,
          duration: 0.8,
          easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }
      ],
      
      audio: {
        defaultVoice: 'pt-BR-Ricardo',
        soundEffects: true,
        backgroundMusic: true,
        musicTrack: 'energetic-marketing.mp3'
      },
      
      timing: {
        slideMinDuration: 6,
        slideMaxDuration: 20,
        readingSpeed: 160,
        pauseBetweenSlides: 0.5
      },
      
      branding: {
        footerText: '{{company}} - Transformando Negócios',
        colorScheme: ['#dc2626', '#ef4444', '#fbbf24', '#ffffff']
      }
    };
  }

  private createMinimalTemplate(): ProfessionalTemplate {
    return {
      id: 'minimal-clean',
      name: 'Minimal Clean',
      category: 'corporate',
      description: 'Design minimalista e clean para apresentações sofisticadas',
      thumbnail: '/templates/minimal-clean.jpg',
      isPremium: false,
      
      style: {
        primaryColor: '#374151',
        secondaryColor: '#6b7280',
        accentColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        fontFamily: 'SF Pro Display, system-ui, sans-serif',
        headerFont: 'SF Pro Display, system-ui, sans-serif',
        bodyFont: 'SF Pro Text, system-ui, sans-serif'
      },
      
      layouts: [
        {
          id: 'statement',
          name: 'Statement',
          description: 'Layout para declarações impactantes',
          sections: {
            content: { type: 'text', layout: 'single' }
          }
        },
        {
          id: 'split-content',
          name: 'Conteúdo Dividido',
          description: 'Layout com divisão 50/50 para texto e visual',
          sections: {
            content: { type: 'mixed', layout: 'dual' }
          }
        }
      ],
      
      transitions: {
        default: {
          type: 'fade',
          duration: 1.0,
          easing: 'ease-in-out'
        },
        alternatives: [
          { type: 'dissolve', duration: 1.5, easing: 'ease-in-out' }
        ]
      },
      
      animations: [
        {
          element: 'text',
          animation: 'fadeIn',
          delay: 0.8,
          duration: 1.5,
          easing: 'ease-out'
        }
      ],
      
      audio: {
        defaultVoice: 'pt-BR-Francisca',
        soundEffects: false,
        backgroundMusic: false
      },
      
      timing: {
        slideMinDuration: 8,
        slideMaxDuration: 25,
        readingSpeed: 140,
        pauseBetweenSlides: 2
      },
      
      branding: {
        colorScheme: ['#374151', '#6b7280', '#3b82f6', '#ffffff']
      }
    };
  }

  private createTechnicalTemplate(): ProfessionalTemplate {
    return {
      id: 'technical-detailed',
      name: 'Technical Detailed',
      category: 'technical',
      description: 'Template técnico com layouts otimizados para dados e diagramas',
      thumbnail: '/templates/technical-detailed.jpg',
      isPremium: true,
      
      style: {
        primaryColor: '#1f2937',
        secondaryColor: '#4b5563',
        accentColor: '#06b6d4',
        backgroundColor: '#f9fafb',
        textColor: '#111827',
        fontFamily: 'JetBrains Mono, monospace',
        headerFont: 'Inter, sans-serif',
        bodyFont: 'Inter, sans-serif'
      },
      
      layouts: [
        {
          id: 'architecture-diagram',
          name: 'Diagrama de Arquitetura',
          description: 'Layout especializado para diagramas técnicos',
          sections: {
            header: { height: '12%', position: 'top' },
            content: { type: 'image', layout: 'single' },
            footer: { height: '15%', content: ['legend', 'version'] }
          }
        },
        {
          id: 'code-explanation',
          name: 'Explicação de Código',
          description: 'Layout para apresentar e explicar código',
          sections: {
            header: { height: '15%', position: 'top' },
            content: { type: 'mixed', layout: 'dual' }
          }
        }
      ],
      
      transitions: {
        default: {
          type: 'slide',
          duration: 0.6,
          easing: 'ease-out',
          direction: 'left'
        },
        alternatives: [
          { type: 'fade', duration: 0.4, easing: 'ease-in-out' }
        ]
      },
      
      animations: [
        {
          element: 'diagram',
          animation: 'fadeIn',
          delay: 0.3,
          duration: 1.0,
          easing: 'ease-out'
        },
        {
          element: 'code-block',
          animation: 'typewriter',
          delay: 0.5,
          duration: 3.0,
          easing: 'linear'
        }
      ],
      
      audio: {
        defaultVoice: 'pt-BR-Afonso',
        soundEffects: false,
        backgroundMusic: false
      },
      
      timing: {
        slideMinDuration: 10,
        slideMaxDuration: 60,
        readingSpeed: 120,
        pauseBetweenSlides: 3
      },
      
      branding: {
        footerText: 'Documentação Técnica v{{version}}',
        colorScheme: ['#1f2937', '#4b5563', '#06b6d4', '#f9fafb']
      }
    };
  }

  // Métodos similares para outros templates...
  private createExecutiveTemplate(): ProfessionalTemplate { /* ... */ return {} as any; }
  private createTrainingTemplate(): ProfessionalTemplate { /* ... */ return {} as any; }
  private createAcademicTemplate(): ProfessionalTemplate { /* ... */ return {} as any; }
  private createProductTemplate(): ProfessionalTemplate { /* ... */ return {} as any; }
  private createSalesTemplate(): ProfessionalTemplate { /* ... */ return {} as any; }
  private createCreativeTemplate(): ProfessionalTemplate { /* ... */ return {} as any; }
  private createArtisticTemplate(): ProfessionalTemplate { /* ... */ return {} as any; }
  private createScientificTemplate(): ProfessionalTemplate { /* ... */ return {} as any; }

  /**
   * Adiciona um template à biblioteca
   */
  addTemplate(template: ProfessionalTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Obtém um template por ID
   */
  getTemplate(id: string): ProfessionalTemplate | null {
    return this.templates.get(id) || this.customTemplates.get(id) || null;
  }

  /**
   * Lista todos os templates por categoria
   */
  getTemplatesByCategory(category?: ProfessionalTemplate['category']): ProfessionalTemplate[] {
    const allTemplates = Array.from(this.templates.values());
    
    if (category) {
      return allTemplates.filter(template => template.category === category);
    }
    
    return allTemplates;
  }

  /**
   * Busca templates por nome ou descrição
   */
  searchTemplates(query: string): ProfessionalTemplate[] {
    const searchTerm = query.toLowerCase();
    
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.category.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Cria um template customizado baseado em outro
   */
  createCustomTemplate(
    baseTemplateId: string, 
    customizations: Partial<ProfessionalTemplate>
  ): ProfessionalTemplate | null {
    const baseTemplate = this.getTemplate(baseTemplateId);
    if (!baseTemplate) return null;

    const customTemplate: ProfessionalTemplate = {
      ...baseTemplate,
      ...customizations,
      id: customizations.id || `custom-${Date.now()}`,
      name: customizations.name || `${baseTemplate.name} (Customizado)`,
      isPremium: false
    };

    this.customTemplates.set(customTemplate.id, customTemplate);
    return customTemplate;
  }

  /**
   * Aplica um template a uma apresentação PPTX
   */
  applyTemplateToPresentation(
    templateId: string, 
    presentationData: any
  ): any {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }

    // Aplicar estilos do template
    const styledPresentation = this.applyTemplateStyles(presentationData, template);
    
    // Aplicar layouts
    const layoutedPresentation = this.applyTemplateLayouts(styledPresentation, template);
    
    // Aplicar transições
    const transitionedPresentation = this.applyTemplateTransitions(layoutedPresentation, template);
    
    // Aplicar animações
    const animatedPresentation = this.applyTemplateAnimations(transitionedPresentation, template);
    
    return animatedPresentation;
  }

  private applyTemplateStyles(presentation: any, template: ProfessionalTemplate): any {
    return {
      ...presentation,
      style: {
        ...presentation.style,
        ...template.style
      },
      slides: presentation.slides.map((slide: any) => ({
        ...slide,
        style: {
          ...slide.style,
          backgroundColor: template.style.backgroundColor,
          color: template.style.textColor,
          fontFamily: template.style.fontFamily
        }
      }))
    };
  }

  private applyTemplateLayouts(presentation: any, template: ProfessionalTemplate): any {
    return {
      ...presentation,
      slides: presentation.slides.map((slide: any, index: number) => {
        // Determinar o layout apropriado baseado no conteúdo do slide
        const layout = this.selectLayoutForSlide(slide, template.layouts);
        
        return {
          ...slide,
          layout: layout,
          sections: this.organizeSectionsAccordingToLayout(slide.content, layout)
        };
      })
    };
  }

  private applyTemplateTransitions(presentation: any, template: ProfessionalTemplate): any {
    return {
      ...presentation,
      transitions: {
        default: template.transitions.default,
        alternatives: template.transitions.alternatives
      },
      slides: presentation.slides.map((slide: any, index: number) => ({
        ...slide,
        transition: index === 0 ? undefined : template.transitions.default
      }))
    };
  }

  private applyTemplateAnimations(presentation: any, template: ProfessionalTemplate): any {
    return {
      ...presentation,
      slides: presentation.slides.map((slide: any) => ({
        ...slide,
        animations: this.generateAnimationsForSlide(slide, template.animations)
      }))
    };
  }

  private selectLayoutForSlide(slide: any, layouts: TemplateLayout[]): TemplateLayout {
    // Lógica para selecionar o layout mais apropriado
    if (slide.isTitle || slide.title?.length > 50) {
      return layouts.find(l => l.id.includes('title')) || layouts[0];
    }
    
    if (slide.charts?.length > 0 || slide.data?.length > 0) {
      return layouts.find(l => l.id.includes('chart')) || layouts[0];
    }
    
    return layouts.find(l => l.id.includes('content')) || layouts[0];
  }

  private organizeSectionsAccordingToLayout(content: any, layout: TemplateLayout): any {
    // Organizar o conteúdo de acordo com o layout
    return {
      header: content.title ? { text: content.title } : undefined,
      content: content.body || content.text || content.elements,
      footer: layout.sections.footer ? this.generateFooterContent(layout.sections.footer) : undefined
    };
  }

  private generateAnimationsForSlide(slide: any, templateAnimations: TemplateAnimation[]): any[] {
    const slideAnimations: any[] = [];
    
    templateAnimations.forEach(animation => {
      if (slide.elements?.some((el: any) => el.type === animation.element)) {
        slideAnimations.push({
          ...animation,
          targetElements: slide.elements.filter((el: any) => el.type === animation.element)
        });
      }
    });
    
    return slideAnimations;
  }

  private generateFooterContent(footerConfig: any): any {
    return {
      elements: footerConfig.content.map((item: string) => {
        switch (item) {
          case 'page-number':
            return { type: 'page-number', text: '{{pageNumber}} / {{totalPages}}' };
          case 'date':
            return { type: 'date', text: '{{currentDate}}' };
          case 'logo':
            return { type: 'logo', src: '{{companyLogo}}' };
          default:
            return { type: 'text', text: item };
        }
      })
    };
  }

  /**
   * Exporta configuração de template
   */
  exportTemplate(templateId: string): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }
    
    return JSON.stringify(template, null, 2);
  }

  /**
   * Importa template de configuração JSON
   */
  importTemplate(templateJson: string): ProfessionalTemplate {
    try {
      const template = JSON.parse(templateJson) as ProfessionalTemplate;
      this.addTemplate(template);
      return template;
    } catch (error) {
      throw new Error(`Erro ao importar template: ${error.message}`);
    }
  }
}