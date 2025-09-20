/**
 * Testes Específicos para Sistema de Validação
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SlideDataValidator, validateSlideExtraction, generateValidationReport } from '../slide-data-validator';

describe('SlideDataValidator', () => {
  let validator: SlideDataValidator;

  beforeEach(() => {
    validator = SlideDataValidator.getInstance();
    vi.clearAllMocks();
  });

  describe('Validação de Slides Individuais', () => {
    it('deve validar slide com dados completos', async () => {
      const slide = {
        title: 'Título Válido',
        content: 'Conteúdo válido com mais de 10 caracteres',
        images: [{
          src: 'https://example.com/image.jpg',
          alt: 'Descrição da imagem',
          position: { x: 100, y: 100, width: 200, height: 150 }
        }],
        notes: 'Notas do slide',
        width: 1920,
        height: 1080
      };

      const result = await validator.validateSlide(slide, 0);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('deve detectar título ausente ou inválido', async () => {
      const slidesSemTitulo = [
        { title: '', content: 'Conteúdo válido', images: [] },
        { title: '   ', content: 'Conteúdo válido', images: [] },
        { title: null, content: 'Conteúdo válido', images: [] },
        { title: undefined, content: 'Conteúdo válido', images: [] }
      ];

      for (const slide of slidesSemTitulo) {
        const result = await validator.validateSlide(slide, 0);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('título'))).toBe(true);
      }
    });

    it('deve detectar conteúdo insuficiente', async () => {
      const slidesConteudoInsuficiente = [
        { title: 'Título', content: '', images: [] },
        { title: 'Título', content: 'Curto', images: [] },
        { title: 'Título', content: '   ', images: [] }
      ];

      for (const slide of slidesConteudoInsuficiente) {
        const result = await validator.validateSlide(slide, 0);
        expect(result.errors.some(e => e.includes('conteúdo'))).toBe(true);
      }
    });

    it('deve validar URLs de imagens', async () => {
      const slideImagensInvalidas = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [
          { src: '', alt: 'Alt válido', position: { x: 0, y: 0, width: 100, height: 100 } },
          { src: 'url-inválida', alt: 'Alt válido', position: { x: 0, y: 0, width: 100, height: 100 } },
          { src: 'ftp://invalid-protocol.com/image.jpg', alt: 'Alt válido', position: { x: 0, y: 0, width: 100, height: 100 } }
        ]
      };

      const result = await validator.validateSlide(slideImagensInvalidas, 0);
      expect(result.errors.some(e => e.includes('URL'))).toBe(true);
    });

    it('deve validar texto alternativo de imagens', async () => {
      const slide = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [
          { src: 'https://example.com/image.jpg', alt: '', position: { x: 0, y: 0, width: 100, height: 100 } },
          { src: 'https://example.com/image2.jpg', alt: '   ', position: { x: 0, y: 0, width: 100, height: 100 } }
        ]
      };

      const result = await validator.validateSlide(slide, 0);
      expect(result.warnings.some(w => w.includes('alt'))).toBe(true);
    });

    it('deve validar posicionamento de imagens', async () => {
      const slide = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [
          { src: 'https://example.com/image.jpg', alt: 'Alt', position: { x: -10, y: -5, width: 0, height: -100 } }
        ]
      };

      const result = await validator.validateSlide(slide, 0);
      expect(result.errors.some(e => e.includes('posição'))).toBe(true);
    });

    it('deve validar dimensões do slide', async () => {
      const slideDimensoesInvalidas = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [],
        width: 0,
        height: -100
      };

      const result = await validator.validateSlide(slideDimensoesInvalidas, 0);
      expect(result.errors.some(e => e.includes('dimensões'))).toBe(true);
    });
  });

  describe('Validação de Múltiplos Slides', () => {
    it('deve validar array de slides', async () => {
      const slides = [
        {
          title: 'Slide 1',
          content: 'Conteúdo do primeiro slide',
          images: []
        },
        {
          title: 'Slide 2',
          content: 'Conteúdo do segundo slide',
          images: [{
            src: 'https://example.com/image.jpg',
            alt: 'Imagem do slide 2',
            position: { x: 50, y: 50, width: 200, height: 150 }
          }]
        }
      ];

      const result = await validator.validateSlides(slides);

      expect(result.summary.totalSlides).toBe(2);
      expect(result.slideResults).toHaveLength(2);
      expect(result.summary.validSlides).toBeGreaterThanOrEqual(0);
    });

    it('deve detectar slides duplicados', async () => {
      const slidesDuplicados = [
        {
          title: 'Slide Duplicado',
          content: 'Mesmo conteúdo',
          images: []
        },
        {
          title: 'Slide Duplicado',
          content: 'Mesmo conteúdo',
          images: []
        }
      ];

      const result = await validator.validateSlides(slidesDuplicados);
      expect(result.globalIssues.some(issue => issue.includes('duplicado'))).toBe(true);
    });

    it('deve validar sequência lógica de slides', async () => {
      const slidesSequenciaInvalida = [
        { title: 'Conclusão', content: 'Slide final', images: [] },
        { title: 'Introdução', content: 'Slide inicial', images: [] },
        { title: 'Desenvolvimento', content: 'Slide do meio', images: [] }
      ];

      const result = await validator.validateSlides(slidesSequenciaInvalida);
      expect(result.globalIssues.some(issue => issue.includes('sequência'))).toBe(true);
    });
  });

  describe('Validação de Mapeamento de Divs', () => {
    it('deve validar mapeamento válido', async () => {
      const divMapping = {
        'slide-1': {
          title: 'Título do Slide 1',
          content: 'Conteúdo detalhado do slide',
          images: [{
            src: 'https://example.com/image1.jpg',
            alt: 'Descrição da imagem 1',
            position: { x: 100, y: 100, width: 300, height: 200 }
          }]
        },
        'slide-2': {
          title: 'Título do Slide 2',
          content: 'Outro conteúdo interessante',
          images: []
        }
      };

      const result = await validator.validateDivMapping(divMapping);

      expect(result.summary.totalDivs).toBe(2);
      expect(result.summary.validDivs).toBe(2);
      expect(result.divResults).toHaveLength(2);
    });

    it('deve detectar divs sem dados', async () => {
      const divMappingInvalido = {
        'slide-1': {
          title: 'Título válido',
          content: 'Conteúdo válido',
          images: []
        },
        'slide-2': null,
        'slide-3': undefined,
        'slide-4': {}
      };

      const result = await validator.validateDivMapping(divMappingInvalido);
      expect(result.summary.validDivs).toBeLessThan(result.summary.totalDivs);
    });

    it('deve validar estrutura de dados das divs', async () => {
      const divMappingEstruturalmenteInvalido = {
        'slide-1': {
          // Faltando propriedades obrigatórias
          images: 'não é um array'
        },
        'slide-2': {
          title: 123, // Tipo incorreto
          content: true, // Tipo incorreto
          images: [{
            src: 'url-válida.jpg',
            position: 'posição inválida' // Tipo incorreto
          }]
        }
      };

      const result = await validator.validateDivMapping(divMappingEstruturalmenteInvalido);
      expect(result.summary.validDivs).toBe(0);
    });
  });

  describe('Configuração do Validador', () => {
    it('deve aplicar configurações personalizadas', () => {
      const config = {
        minContentLength: 20,
        maxContentLength: 1000,
        requireImages: true,
        requireNotes: false,
        allowEmptyAlt: false,
        strictImageValidation: true
      };

      validator.configure(config);

      // Testa se a configuração foi aplicada
      const validatorConfig = (validator as any).config;
      expect(validatorConfig.minContentLength).toBe(20);
      expect(validatorConfig.requireImages).toBe(true);
    });

    it('deve usar configuração padrão quando não especificada', () => {
      const newValidator = SlideDataValidator.getInstance();
      const config = (newValidator as any).config;

      expect(config.minContentLength).toBeDefined();
      expect(config.maxContentLength).toBeDefined();
      expect(typeof config.requireImages).toBe('boolean');
    });
  });

  describe('Geração de Relatórios', () => {
    it('deve gerar relatório detalhado de validação', () => {
      const validationResult = {
        summary: {
          totalSlides: 3,
          validSlides: 2,
          invalidSlides: 1
        },
        slideResults: [
          {
            slideId: 'slide-1',
            isValid: true,
            errors: [],
            warnings: ['Imagem sem texto alternativo']
          },
          {
            slideId: 'slide-2',
            isValid: true,
            errors: [],
            warnings: []
          },
          {
            slideId: 'slide-3',
            isValid: false,
            errors: ['Título ausente', 'Conteúdo insuficiente'],
            warnings: []
          }
        ],
        globalIssues: ['Possível slide duplicado detectado']
      };

      const divMappingResult = {
        summary: {
          totalDivs: 2,
          validDivs: 2
        },
        divResults: []
      };

      const report = validator.generateValidationReport(validationResult, divMappingResult);

      expect(report).toContain('Validation Report');
      expect(report).toContain('Total Slides: 3');
      expect(report).toContain('Valid Slides: 2');
      expect(report).toContain('Título ausente');
      expect(report).toContain('slide duplicado');
    });

    it('deve incluir estatísticas detalhadas no relatório', () => {
      const validationResult = {
        summary: { totalSlides: 5, validSlides: 3, invalidSlides: 2 },
        slideResults: [],
        globalIssues: []
      };

      const report = validator.generateValidationReport(validationResult, {});

      expect(report).toContain('60%'); // Taxa de sucesso
      expect(report).toContain('Statistics');
    });
  });

  describe('Funções Utilitárias', () => {
    it('validateSlideExtraction deve funcionar corretamente', async () => {
      const slides = [
        {
          title: 'Slide Teste',
          content: 'Conteúdo de teste válido',
          images: []
        }
      ];

      const result = await validateSlideExtraction(slides);

      expect(result).toBeDefined();
      expect(result.summary.totalSlides).toBe(1);
    });

    it('generateValidationReport deve funcionar como função standalone', () => {
      const validationResult = {
        summary: { totalSlides: 1, validSlides: 1, invalidSlides: 0 },
        slideResults: [],
        globalIssues: []
      };

      const report = generateValidationReport(validationResult, {});

      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });
  });

  describe('Casos Extremos', () => {
    it('deve lidar com array vazio de slides', async () => {
      const result = await validator.validateSlides([]);

      expect(result.summary.totalSlides).toBe(0);
      expect(result.summary.validSlides).toBe(0);
      expect(result.slideResults).toHaveLength(0);
    });

    it('deve lidar com slides com propriedades null/undefined', async () => {
      const slideProblematico = {
        title: null,
        content: undefined,
        images: null
      };

      const result = await validator.validateSlide(slideProblematico, 0);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve lidar com imagens com propriedades malformadas', async () => {
      const slide = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [
          {
            src: 'https://example.com/image.jpg',
            alt: 'Alt válido',
            position: null
          },
          {
            src: 'https://example.com/image2.jpg',
            alt: 'Alt válido',
            position: {
              x: 'não é número',
              y: null,
              width: undefined,
              height: 'também não é número'
            }
          }
        ]
      };

      const result = await validator.validateSlide(slide, 0);
      expect(result.errors.some(e => e.includes('posição'))).toBe(true);
    });

    it('deve lidar com conteúdo extremamente longo', async () => {
      const conteudoLongo = 'A'.repeat(10000);
      const slide = {
        title: 'Título',
        content: conteudoLongo,
        images: []
      };

      const result = await validator.validateSlide(slide, 0);
      // Deve processar sem erros, mas pode gerar warning
      expect(result).toBeDefined();
    });

    it('deve lidar com muitas imagens em um slide', async () => {
      const muitasImagens = Array(50).fill(null).map((_, index) => ({
        src: `https://example.com/image${index}.jpg`,
        alt: `Imagem ${index}`,
        position: { x: index * 10, y: index * 10, width: 100, height: 100 }
      }));

      const slide = {
        title: 'Slide com muitas imagens',
        content: 'Conteúdo válido',
        images: muitasImagens
      };

      const result = await validator.validateSlide(slide, 0);
      expect(result.warnings.some(w => w.includes('muitas imagens'))).toBe(true);
    });
  });

  describe('Performance', () => {
    it('deve validar muitos slides em tempo razoável', async () => {
      const muitosSlides = Array(100).fill(null).map((_, index) => ({
        title: `Slide ${index + 1}`,
        content: `Conteúdo do slide ${index + 1} com texto suficiente`,
        images: []
      }));

      const startTime = Date.now();
      const result = await validator.validateSlides(muitosSlides);
      const processingTime = Date.now() - startTime;

      expect(result.summary.totalSlides).toBe(100);
      expect(processingTime).toBeLessThan(5000); // Menos de 5 segundos
    });

    it('deve ser eficiente com validação de imagens', async () => {
      const slideComMuitasImagens = {
        title: 'Slide de Performance',
        content: 'Conteúdo de teste para performance',
        images: Array(20).fill(null).map((_, index) => ({
          src: `https://example.com/image${index}.jpg`,
          alt: `Imagem ${index}`,
          position: { x: 0, y: 0, width: 100, height: 100 }
        }))
      };

      const startTime = Date.now();
      const result = await validator.validateSlide(slideComMuitasImagens, 0);
      const processingTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(1000); // Menos de 1 segundo
    });
  });
});