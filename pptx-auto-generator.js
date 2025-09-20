// ========== GERADOR AUTOMÁTICO DE SLIDES PPTX ==========

import { PPTXSlideManager } from './pptx-slide-manager.js';
import { PPTXThemeManager } from './pptx-theme-manager.js';

export class PPTXAutoGenerator {
  constructor() {
    this.slideManager = new PPTXSlideManager();
    this.themeManager = new PPTXThemeManager();
    this.templates = this.initializeTemplates();
  }

  initializeTemplates() {
    return {
      // Template para dados tabulares
      table: {
        analyze: (data) => {
          const headers = Object.keys(data[0] || {});
          const rowCount = data.length;
          const colCount = headers.length;
          
          // Determinar melhor layout baseado no tamanho dos dados
          if (rowCount <= 5 && colCount <= 4) {
            return 'simple-table';
          } else if (rowCount <= 10) {
            return 'scrollable-table';
          } else {
            return 'paginated-table';
          }
        },
        generate: async (data, options = {}) => {
          const layout = options.layout || this.templates.table.analyze(data);
          const slides = [];

          switch (layout) {
            case 'simple-table':
              slides.push(await this.createSimpleTableSlide(data, options));
              break;
            case 'scrollable-table':
              slides.push(await this.createScrollableTableSlide(data, options));
              break;
            case 'paginated-table':
              slides.push(...await this.createPaginatedTableSlides(data, options));
              break;
          }

          return slides;
        }
      },

      // Template para gráficos
      chart: {
        analyze: (data) => {
          const values = Object.values(data).flat();
          const hasNegatives = values.some(v => v < 0);
          const ratio = Math.max(...values) / Math.min(...values);

          if (hasNegatives) return 'bar';
          if (ratio > 10) return 'logarithmic';
          return 'linear';
        },
        generate: async (data, options = {}) => {
          const type = options.type || this.templates.chart.analyze(data);
          return await this.createChartSlide(data, { ...options, type });
        }
      },

      // Template para listas
      list: {
        analyze: (items) => {
          const maxDepth = this.calculateListDepth(items);
          const totalItems = this.countListItems(items);

          if (maxDepth > 2) return 'hierarchical';
          if (totalItems > 10) return 'paginated-list';
          return 'simple-list';
        },
        generate: async (items, options = {}) => {
          const layout = options.layout || this.templates.list.analyze(items);
          const slides = [];

          switch (layout) {
            case 'simple-list':
              slides.push(await this.createSimpleListSlide(items, options));
              break;
            case 'hierarchical':
              slides.push(await this.createHierarchicalListSlide(items, options));
              break;
            case 'paginated-list':
              slides.push(...await this.createPaginatedListSlides(items, options));
              break;
          }

          return slides;
        }
      },

      // Template para comparações
      comparison: {
        analyze: (items) => {
          const itemCount = items.length;
          if (itemCount === 2) return 'side-by-side';
          if (itemCount <= 4) return 'grid';
          return 'carousel';
        },
        generate: async (items, options = {}) => {
          const layout = options.layout || this.templates.comparison.analyze(items);
          return await this.createComparisonSlides(items, { ...options, layout });
        }
      },

      // Template para timeline
      timeline: {
        analyze: (events) => {
          const totalEvents = events.length;
          if (totalEvents <= 5) return 'simple-timeline';
          if (totalEvents <= 10) return 'extended-timeline';
          return 'paginated-timeline';
        },
        generate: async (events, options = {}) => {
          const layout = options.layout || this.templates.timeline.analyze(events);
          return await this.createTimelineSlides(events, { ...options, layout });
        }
      }
    };
  }

  // Métodos principais de geração
  async generateFromData(data, options = {}) {
    // Determinar tipo de dados e gerar slides apropriados
    const type = this.analyzeDataType(data);
    const template = this.templates[type];

    if (!template) {
      throw new Error(`Tipo de dados não suportado: ${type}`);
    }

    const slides = await template.generate(data, options);
    return this.applyThemeToSlides(slides, options.theme);
  }

  async generatePresentation(sections, options = {}) {
    const slides = [];

    // Gerar slide de título se necessário
    if (options.title) {
      slides.push(await this.createTitleSlide(options.title, options));
    }

    // Processar cada seção
    for (const section of sections) {
      // Adicionar slide de seção se necessário
      if (section.title) {
        slides.push(await this.createSectionSlide(section.title, options));
      }

      // Gerar slides para o conteúdo da seção
      const sectionSlides = await this.generateFromData(
        section.content,
        { ...options, ...section.options }
      );
      slides.push(...sectionSlides);
    }

    return slides;
  }

  // Métodos auxiliares
  analyzeDataType(data) {
    if (Array.isArray(data)) {
      if (data.length === 0) return 'empty';
      if (typeof data[0] === 'object') {
        if (data[0].hasOwnProperty('date') || data[0].hasOwnProperty('timestamp')) {
          return 'timeline';
        }
        return 'table';
      }
      return 'list';
    }

    if (typeof data === 'object') {
      if (data.type === 'chart') return 'chart';
      if (data.type === 'comparison') return 'comparison';
    }

    throw new Error('Tipo de dados não reconhecido');
  }

  calculateListDepth(items, currentDepth = 0) {
    if (!Array.isArray(items)) return currentDepth;
    
    let maxDepth = currentDepth;
    for (const item of items) {
      if (item.children) {
        const depth = this.calculateListDepth(item.children, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }
    return maxDepth;
  }

  countListItems(items) {
    if (!Array.isArray(items)) return 0;
    
    let count = items.length;
    for (const item of items) {
      if (item.children) {
        count += this.countListItems(item.children);
      }
    }
    return count;
  }

  async applyThemeToSlides(slides, themeName) {
    if (themeName) {
      this.themeManager.setActiveTheme(themeName);
    }

    return slides.map(slide => this.themeManager.applyThemeToSlide(slide));
  }

  // Métodos de criação de slides específicos
  async createTitleSlide(title, options = {}) {
    return await this.slideManager.createSlide({
      layout: 'title',
      title: title,
      subtitle: options.subtitle,
      date: options.date || new Date().toLocaleDateString()
    });
  }

  async createSectionSlide(title, options = {}) {
    return await this.slideManager.createSlide({
      layout: 'section',
      title: title,
      background: options.sectionBackground
    });
  }

  async createSimpleTableSlide(data, options = {}) {
    return await this.slideManager.createSlide({
      layout: 'table',
      title: options.title,
      content: [{
        type: 'table',
        data: data,
        style: options.tableStyle
      }]
    });
  }

  async createChartSlide(data, options = {}) {
    return await this.slideManager.createSlide({
      layout: 'chart',
      title: options.title,
      content: [{
        type: 'chart',
        chartType: options.type,
        data: data,
        style: options.chartStyle
      }]
    });
  }

  async createComparisonSlides(items, options = {}) {
    const slides = [];
    const { layout } = options;

    if (layout === 'side-by-side') {
      slides.push(await this.slideManager.createSlide({
        layout: 'comparison',
        title: options.title,
        content: items.map(item => ({
          type: 'content',
          title: item.title,
          text: item.description,
          image: item.image
        }))
      }));
    } else {
      // Implementar outros layouts de comparação
      // ...
    }

    return slides;
  }

  async createTimelineSlides(events, options = {}) {
    const slides = [];
    const { layout } = options;

    if (layout === 'simple-timeline') {
      slides.push(await this.slideManager.createSlide({
        layout: 'timeline',
        title: options.title,
        content: [{
          type: 'timeline',
          events: events,
          style: options.timelineStyle
        }]
      }));
    } else {
      // Implementar outros layouts de timeline
      // ...
    }

    return slides;
  }
}