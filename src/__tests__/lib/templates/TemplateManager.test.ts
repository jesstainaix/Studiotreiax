/**
 * Testes unitários para o Sistema de Templates Profissionais
 */

import { TemplateManager, ProfessionalTemplate } from '../../../lib/templates/TemplateManager';

describe('TemplateManager', () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    templateManager = new TemplateManager();
  });

  describe('Initialization', () => {
    it('should initialize with default templates', () => {
      const templates = templateManager.getTemplatesByCategory();
      expect(templates.length).toBeGreaterThan(0);
      
      // Check if we have templates for each category
      const categories = ['corporate', 'educational', 'marketing', 'technical'];
      categories.forEach(category => {
        const categoryTemplates = templateManager.getTemplatesByCategory(category as any);
        expect(categoryTemplates.length).toBeGreaterThan(0);
      });
    });

    it('should have properly structured default templates', () => {
      const templates = templateManager.getTemplatesByCategory();
      
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('style');
        expect(template).toHaveProperty('layouts');
        expect(template).toHaveProperty('transitions');
        expect(template).toHaveProperty('animations');
        expect(template).toHaveProperty('audio');
        expect(template).toHaveProperty('timing');
        expect(template).toHaveProperty('branding');
        
        // Validate style properties
        expect(template.style).toHaveProperty('primaryColor');
        expect(template.style).toHaveProperty('secondaryColor');
        expect(template.style).toHaveProperty('accentColor');
        expect(template.style).toHaveProperty('backgroundColor');
        expect(template.style).toHaveProperty('textColor');
        expect(template.style).toHaveProperty('fontFamily');
        
        // Validate layouts
        expect(Array.isArray(template.layouts)).toBe(true);
        expect(template.layouts.length).toBeGreaterThan(0);
        
        // Validate transitions
        expect(template.transitions).toHaveProperty('default');
        expect(template.transitions).toHaveProperty('alternatives');
        
        // Validate animations
        expect(Array.isArray(template.animations)).toBe(true);
      });
    });
  });

  describe('Template Retrieval', () => {
    it('should get template by ID', () => {
      const template = templateManager.getTemplate('corporate-professional');
      expect(template).not.toBeNull();
      expect(template?.id).toBe('corporate-professional');
      expect(template?.name).toBe('Corporate Professional');
    });

    it('should return null for non-existent template', () => {
      const template = templateManager.getTemplate('non-existent-template');
      expect(template).toBeNull();
    });

    it('should get templates by category', () => {
      const corporateTemplates = templateManager.getTemplatesByCategory('corporate');
      expect(corporateTemplates.length).toBeGreaterThan(0);
      
      corporateTemplates.forEach(template => {
        expect(template.category).toBe('corporate');
      });
    });

    it('should get all templates when no category specified', () => {
      const allTemplates = templateManager.getTemplatesByCategory();
      const corporateTemplates = templateManager.getTemplatesByCategory('corporate');
      const educationalTemplates = templateManager.getTemplatesByCategory('educational');
      
      expect(allTemplates.length).toBeGreaterThanOrEqual(
        corporateTemplates.length + educationalTemplates.length
      );
    });
  });

  describe('Template Search', () => {
    it('should search templates by name', () => {
      const results = templateManager.searchTemplates('Corporate');
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(template => {
        expect(
          template.name.toLowerCase().includes('corporate') ||
          template.description.toLowerCase().includes('corporate') ||
          template.category.toLowerCase().includes('corporate')
        ).toBe(true);
      });
    });

    it('should search templates by description', () => {
      const results = templateManager.searchTemplates('professional');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search templates by category', () => {
      const results = templateManager.searchTemplates('educational');
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(template => {
        expect(
          template.name.toLowerCase().includes('educational') ||
          template.description.toLowerCase().includes('educational') ||
          template.category === 'educational'
        ).toBe(true);
      });
    });

    it('should return empty array for non-matching search', () => {
      const results = templateManager.searchTemplates('xyzabc123nonexistent');
      expect(results).toEqual([]);
    });

    it('should be case insensitive', () => {
      const lowerResults = templateManager.searchTemplates('corporate');
      const upperResults = templateManager.searchTemplates('CORPORATE');
      
      expect(lowerResults.length).toBe(upperResults.length);
    });
  });

  describe('Custom Template Creation', () => {
    it('should create custom template based on existing template', () => {
      const baseTemplate = templateManager.getTemplate('corporate-professional');
      expect(baseTemplate).not.toBeNull();

      const customTemplate = templateManager.createCustomTemplate(baseTemplate!.id, {
        name: 'My Custom Corporate',
        style: {
          ...baseTemplate!.style,
          primaryColor: '#ff0000'
        }
      });

      expect(customTemplate).not.toBeNull();
      expect(customTemplate!.name).toBe('My Custom Corporate');
      expect(customTemplate!.style.primaryColor).toBe('#ff0000');
      expect(customTemplate!.isPremium).toBe(false);
    });

    it('should return null when base template does not exist', () => {
      const customTemplate = templateManager.createCustomTemplate('non-existent', {
        name: 'Custom Template'
      });

      expect(customTemplate).toBeNull();
    });

    it('should generate unique ID for custom template', () => {
      const baseTemplate = templateManager.getTemplate('corporate-professional');
      
      const custom1 = templateManager.createCustomTemplate(baseTemplate!.id, {
        name: 'Custom 1'
      });
      
      const custom2 = templateManager.createCustomTemplate(baseTemplate!.id, {
        name: 'Custom 2'
      });

      expect(custom1!.id).not.toBe(custom2!.id);
      expect(custom1!.id).toMatch(/^custom-\d+$/);
      expect(custom2!.id).toMatch(/^custom-\d+$/);
    });

    it('should allow custom ID specification', () => {
      const baseTemplate = templateManager.getTemplate('corporate-professional');
      
      const customTemplate = templateManager.createCustomTemplate(baseTemplate!.id, {
        id: 'my-custom-id',
        name: 'Custom Template'
      });

      expect(customTemplate!.id).toBe('my-custom-id');
    });
  });

  describe('Template Application', () => {
    const mockPresentation = {
      title: 'Test Presentation',
      slides: [
        {
          id: 'slide-1',
          title: 'Introduction',
          content: 'Welcome to our presentation',
          isTitle: true
        },
        {
          id: 'slide-2',
          title: 'Content Slide',
          content: 'This is content with some charts',
          charts: [{ type: 'bar', data: [] }]
        },
        {
          id: 'slide-3',
          title: 'Regular Content',
          content: 'Regular slide content'
        }
      ]
    };

    it('should apply template to presentation successfully', () => {
      const template = templateManager.getTemplate('corporate-professional');
      expect(template).not.toBeNull();

      const styledPresentation = templateManager.applyTemplateToPresentation(
        template!.id,
        mockPresentation
      );

      expect(styledPresentation).toHaveProperty('style');
      expect(styledPresentation.style.primaryColor).toBe(template!.style.primaryColor);
      expect(styledPresentation.style.fontFamily).toBe(template!.style.fontFamily);
      
      // Check if slides have been styled
      expect(styledPresentation.slides).toHaveLength(mockPresentation.slides.length);
      styledPresentation.slides.forEach((slide: any) => {
        expect(slide.style).toHaveProperty('backgroundColor');
        expect(slide.style).toHaveProperty('color');
        expect(slide.style).toHaveProperty('fontFamily');
      });
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        templateManager.applyTemplateToPresentation('non-existent', mockPresentation);
      }).toThrow('Template non-existent não encontrado');
    });

    it('should apply appropriate layouts based on slide content', () => {
      const template = templateManager.getTemplate('corporate-professional');
      
      const styledPresentation = templateManager.applyTemplateToPresentation(
        template!.id,
        mockPresentation
      );

      // Title slide should get title layout
      const titleSlide = styledPresentation.slides[0];
      expect(titleSlide.layout.id).toContain('title');
      
      // Chart slide should get chart layout
      const chartSlide = styledPresentation.slides[1];
      expect(chartSlide.layout.id).toContain('chart');
      
      // Regular slide should get content layout
      const contentSlide = styledPresentation.slides[2];
      expect(contentSlide.layout.id).toContain('content');
    });

    it('should apply transitions to slides', () => {
      const template = templateManager.getTemplate('corporate-professional');
      
      const styledPresentation = templateManager.applyTemplateToPresentation(
        template!.id,
        mockPresentation
      );

      expect(styledPresentation.transitions).toHaveProperty('default');
      expect(styledPresentation.transitions).toHaveProperty('alternatives');
      
      // First slide should not have transition
      expect(styledPresentation.slides[0].transition).toBeUndefined();
      
      // Other slides should have transitions
      for (let i = 1; i < styledPresentation.slides.length; i++) {
        expect(styledPresentation.slides[i].transition).toBeDefined();
        expect(styledPresentation.slides[i].transition.type).toBe(template!.transitions.default.type);
      }
    });

    it('should generate animations for slide elements', () => {
      const template = templateManager.getTemplate('corporate-professional');
      
      const styledPresentation = templateManager.applyTemplateToPresentation(
        template!.id,
        mockPresentation
      );

      styledPresentation.slides.forEach((slide: any) => {
        expect(slide.animations).toBeDefined();
        expect(Array.isArray(slide.animations)).toBe(true);
      });
    });
  });

  describe('Template Import/Export', () => {
    it('should export template as JSON', () => {
      const template = templateManager.getTemplate('corporate-professional');
      expect(template).not.toBeNull();

      const exportedJson = templateManager.exportTemplate(template!.id);
      
      expect(typeof exportedJson).toBe('string');
      
      const parsedTemplate = JSON.parse(exportedJson);
      expect(parsedTemplate.id).toBe(template!.id);
      expect(parsedTemplate.name).toBe(template!.name);
      expect(parsedTemplate.style).toEqual(template!.style);
    });

    it('should throw error when exporting non-existent template', () => {
      expect(() => {
        templateManager.exportTemplate('non-existent');
      }).toThrow('Template non-existent não encontrado');
    });

    it('should import template from JSON', () => {
      const mockTemplate: ProfessionalTemplate = {
        id: 'imported-template',
        name: 'Imported Template',
        category: 'corporate',
        description: 'Template imported for testing',
        thumbnail: '',
        isPremium: false,
        style: {
          primaryColor: '#000000',
          secondaryColor: '#333333',
          accentColor: '#ff0000',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          fontFamily: 'Arial, sans-serif',
          headerFont: 'Arial, sans-serif',
          bodyFont: 'Arial, sans-serif'
        },
        layouts: [],
        transitions: {
          default: { type: 'fade', duration: 1, easing: 'ease-in-out' },
          alternatives: []
        },
        animations: [],
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
          colorScheme: ['#000000', '#333333', '#ff0000', '#ffffff']
        }
      };

      const templateJson = JSON.stringify(mockTemplate);
      const importedTemplate = templateManager.importTemplate(templateJson);

      expect(importedTemplate.id).toBe('imported-template');
      expect(importedTemplate.name).toBe('Imported Template');
      
      // Verify template was added to manager
      const retrievedTemplate = templateManager.getTemplate('imported-template');
      expect(retrievedTemplate).not.toBeNull();
      expect(retrievedTemplate!.name).toBe('Imported Template');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        templateManager.importTemplate('invalid json');
      }).toThrow('Erro ao importar template');
    });
  });

  describe('Template Validation', () => {
    it('should validate color values', () => {
      const templates = templateManager.getTemplatesByCategory();
      
      templates.forEach(template => {
        // Check if colors are valid hex codes
        expect(template.style.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(template.style.secondaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(template.style.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(template.style.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(template.style.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should validate timing values', () => {
      const templates = templateManager.getTemplatesByCategory();
      
      templates.forEach(template => {
        expect(template.timing.slideMinDuration).toBeGreaterThan(0);
        expect(template.timing.slideMaxDuration).toBeGreaterThan(template.timing.slideMinDuration);
        expect(template.timing.readingSpeed).toBeGreaterThan(0);
        expect(template.timing.pauseBetweenSlides).toBeGreaterThanOrEqual(0);
      });
    });

    it('should validate transition values', () => {
      const templates = templateManager.getTemplatesByCategory();
      const validTransitionTypes = ['fade', 'slide', 'zoom', 'flip', 'cube', 'dissolve', 'wipe'];
      const validEasings = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'];
      
      templates.forEach(template => {
        expect(validTransitionTypes).toContain(template.transitions.default.type);
        expect(validEasings).toContain(template.transitions.default.easing);
        expect(template.transitions.default.duration).toBeGreaterThan(0);
        
        template.transitions.alternatives.forEach(transition => {
          expect(validTransitionTypes).toContain(transition.type);
          expect(validEasings).toContain(transition.easing);
          expect(transition.duration).toBeGreaterThan(0);
        });
      });
    });

    it('should validate font families', () => {
      const templates = templateManager.getTemplatesByCategory();
      
      templates.forEach(template => {
        expect(typeof template.style.fontFamily).toBe('string');
        expect(template.style.fontFamily.length).toBeGreaterThan(0);
        expect(typeof template.style.headerFont).toBe('string');
        expect(template.style.headerFont.length).toBeGreaterThan(0);
        expect(typeof template.style.bodyFont).toBe('string');
        expect(template.style.bodyFont.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance', () => {
    it('should handle large number of templates efficiently', () => {
      const startTime = performance.now();
      
      // Add 100 custom templates
      for (let i = 0; i < 100; i++) {
        templateManager.createCustomTemplate('corporate-professional', {
          id: `perf-test-${i}`,
          name: `Performance Test Template ${i}`
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should search efficiently across many templates', () => {
      // Add many templates first
      for (let i = 0; i < 50; i++) {
        templateManager.createCustomTemplate('corporate-professional', {
          id: `search-test-${i}`,
          name: `Search Test Template ${i}`,
          description: `Template for search performance testing ${i}`
        });
      }

      const startTime = performance.now();
      const results = templateManager.searchTemplates('Search Test');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});