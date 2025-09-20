/**
 * Testes Específicos para Sistema de Auto-Correção
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoCorrectionService, correctSlideData, generateCorrectionReport } from '../auto-correction-service';

describe('AutoCorrectionService', () => {
  let correctionService: AutoCorrectionService;

  beforeEach(() => {
    correctionService = AutoCorrectionService.getInstance();
    vi.clearAllMocks();
  });

  describe('Correção de Títulos', () => {
    it('deve corrigir título vazio', async () => {
      const slide = {
        title: '',
        content: 'Este é o conteúdo principal do slide sobre vendas',
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.title).toBeTruthy();
      expect(result.correctedSlide.title).toContain('Slide');
      expect(result.corrections.some(c => c.type === 'title_generated')).toBe(true);
    });

    it('deve gerar título baseado no conteúdo', async () => {
      const slide = {
        title: '   ',
        content: 'Análise de vendas do primeiro trimestre mostra crescimento de 15%',
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.title.toLowerCase()).toMatch(/vendas|análise|trimestre/);
      expect(result.corrections.some(c => c.type === 'title_generated')).toBe(true);
    });

    it('deve limpar e formatar título existente', async () => {
      const slide = {
        title: '   título com espaços extras   e formatação ruim   ',
        content: 'Conteúdo válido',
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.title).toBe('Título com espaços extras e formatação ruim');
      expect(result.corrections.some(c => c.type === 'title_cleaned')).toBe(true);
    });

    it('deve capitalizar primeira letra do título', async () => {
      const slide = {
        title: 'título sem capitalização',
        content: 'Conteúdo válido',
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.title).toBe('Título sem capitalização');
      expect(result.corrections.some(c => c.type === 'title_capitalized')).toBe(true);
    });

    it('deve truncar título muito longo', async () => {
      const tituloLongo = 'Este é um título extremamente longo que excede o limite recomendado de caracteres para títulos de slides e precisa ser truncado para manter a legibilidade';
      const slide = {
        title: tituloLongo,
        content: 'Conteúdo válido',
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.title.length).toBeLessThanOrEqual(100);
      expect(result.correctedSlide.title).toContain('...');
      expect(result.corrections.some(c => c.type === 'title_truncated')).toBe(true);
    });
  });

  describe('Correção de Conteúdo', () => {
    it('deve expandir conteúdo muito curto', async () => {
      const slide = {
        title: 'Vendas',
        content: 'Subiu',
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.content.length).toBeGreaterThan(slide.content.length);
      expect(result.corrections.some(c => c.type === 'content_expanded')).toBe(true);
    });

    it('deve limpar formatação desnecessária do conteúdo', async () => {
      const slide = {
        title: 'Título',
        content: '   Conteúdo   com    espaços    extras   e\n\n\nmuitas\n\n\nquebras   ',
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.content).toBe('Conteúdo com espaços extras e\n\nmuitas\n\nquebras');
      expect(result.corrections.some(c => c.type === 'content_cleaned')).toBe(true);
    });

    it('deve corrigir pontuação básica', async () => {
      const slide = {
        title: 'Título',
        content: 'primeiro ponto segundo ponto terceiro ponto sem pontuação adequada',
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.content).toMatch(/[.!?]/);
      expect(result.corrections.some(c => c.type === 'punctuation_fixed')).toBe(true);
    });

    it('deve estruturar listas não formatadas', async () => {
      const slide = {
        title: 'Lista de Itens',
        content: 'Item um Item dois Item três Item quatro',
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.content).toMatch(/•|\*|-|\d\./); // Marcadores de lista
      expect(result.corrections.some(c => c.type === 'content_structured')).toBe(true);
    });

    it('deve truncar conteúdo excessivamente longo', async () => {
      const conteudoLongo = 'A'.repeat(5000);
      const slide = {
        title: 'Título',
        content: conteudoLongo,
        images: []
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.content.length).toBeLessThan(conteudoLongo.length);
      expect(result.corrections.some(c => c.type === 'content_truncated')).toBe(true);
    });
  });

  describe('Correção de Imagens', () => {
    it('deve corrigir URLs de imagens inválidas', async () => {
      const slide = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [
          {
            src: 'url-inválida',
            alt: 'Descrição válida',
            position: { x: 100, y: 100, width: 200, height: 150 }
          },
          {
            src: '',
            alt: 'Outra descrição',
            position: { x: 300, y: 100, width: 200, height: 150 }
          }
        ]
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.images.every(img => img.src.startsWith('http'))).toBe(true);
      expect(result.corrections.some(c => c.type === 'image_url_fixed')).toBe(true);
    });

    it('deve gerar texto alternativo ausente', async () => {
      const slide = {
        title: 'Título',
        content: 'Conteúdo sobre gráficos de vendas e análise de mercado',
        images: [
          {
            src: 'https://example.com/chart.jpg',
            alt: '',
            position: { x: 100, y: 100, width: 300, height: 200 }
          },
          {
            src: 'https://example.com/graph.png',
            alt: '   ',
            position: { x: 400, y: 100, width: 300, height: 200 }
          }
        ]
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.images.every(img => img.alt.trim().length > 0)).toBe(true);
      expect(result.corrections.some(c => c.type === 'alt_text_generated')).toBe(true);
    });

    it('deve corrigir posicionamento inválido de imagens', async () => {
      const slide = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [
          {
            src: 'https://example.com/image.jpg',
            alt: 'Descrição',
            position: { x: -50, y: -30, width: 0, height: -100 }
          }
        ]
      };

      const result = await correctionService.correctSlide(slide, 0);

      const pos = result.correctedSlide.images[0].position;
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.width).toBeGreaterThan(0);
      expect(pos.height).toBeGreaterThan(0);
      expect(result.corrections.some(c => c.type === 'image_position_fixed')).toBe(true);
    });

    it('deve remover imagens duplicadas', async () => {
      const slide = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [
          {
            src: 'https://example.com/image.jpg',
            alt: 'Descrição 1',
            position: { x: 100, y: 100, width: 200, height: 150 }
          },
          {
            src: 'https://example.com/image.jpg',
            alt: 'Descrição 2',
            position: { x: 300, y: 100, width: 200, height: 150 }
          }
        ]
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.images).toHaveLength(1);
      expect(result.corrections.some(c => c.type === 'duplicate_images_removed')).toBe(true);
    });

    it('deve otimizar muitas imagens em um slide', async () => {
      const muitasImagens = Array(15).fill(null).map((_, index) => ({
        src: `https://example.com/image${index}.jpg`,
        alt: `Imagem ${index}`,
        position: { x: index * 50, y: 100, width: 100, height: 100 }
      }));

      const slide = {
        title: 'Slide com muitas imagens',
        content: 'Conteúdo válido',
        images: muitasImagens
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.images.length).toBeLessThanOrEqual(10);
      expect(result.corrections.some(c => c.type === 'images_optimized')).toBe(true);
    });
  });

  describe('Correção de Dimensões', () => {
    it('deve corrigir dimensões inválidas do slide', async () => {
      const slide = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [],
        width: 0,
        height: -100
      };

      const result = await correctionService.correctSlide(slide, 0);

      expect(result.correctedSlide.width).toBeGreaterThan(0);
      expect(result.correctedSlide.height).toBeGreaterThan(0);
      expect(result.corrections.some(c => c.type === 'dimensions_fixed')).toBe(true);
    });

    it('deve aplicar proporções padrão quando necessário', async () => {
      const slide = {
        title: 'Título',
        content: 'Conteúdo válido',
        images: [],
        width: 100,
        height: 2000 // Proporção muito estranha
      };

      const result = await correctionService.correctSlide(slide, 0);

      const aspectRatio = result.correctedSlide.width / result.correctedSlide.height;
      expect(aspectRatio).toBeCloseTo(16/9, 1); // Próximo ao padrão 16:9
      expect(result.corrections.some(c => c.type === 'aspect_ratio_fixed')).toBe(true);
    });
  });

  describe('Correção de Múltiplos Slides', () => {
    it('deve corrigir array de slides', async () => {
      const slides = [
        {
          title: '',
          content: 'Primeiro slide com conteúdo sobre vendas',
          images: []
        },
        {
          title: 'segundo slide',
          content: 'Curto',
          images: [{
            src: 'url-inválida',
            alt: '',
            position: { x: -10, y: -5, width: 0, height: 100 }
          }]
        }
      ];

      const result = await correctionService.correctSlides(slides);

      expect(result.correctedSlides).toHaveLength(2);
      expect(result.summary.totalSlides).toBe(2);
      expect(result.summary.correctedSlides).toBeGreaterThan(0);
      expect(result.slideResults.every(r => r.corrections.length > 0)).toBe(true);
    });

    it('deve detectar e corrigir inconsistências entre slides', async () => {
      const slides = [
        {
          title: 'Slide 1',
          content: 'Conteúdo detalhado do primeiro slide',
          images: [],
          width: 1920,
          height: 1080
        },
        {
          title: 'Slide 2',
          content: 'Conteúdo do segundo slide',
          images: [],
          width: 800, // Dimensão inconsistente
          height: 600
        }
      ];

      const result = await correctionService.correctSlides(slides);

      // Todos os slides devem ter dimensões consistentes
      const widths = result.correctedSlides.map(s => s.width);
      const heights = result.correctedSlides.map(s => s.height);
      expect(new Set(widths).size).toBe(1); // Todas as larguras iguais
      expect(new Set(heights).size).toBe(1); // Todas as alturas iguais
    });

    it('deve normalizar estilos entre slides', async () => {
      const slides = [
        {
          title: 'TÍTULO EM MAIÚSCULAS',
          content: 'conteúdo em minúsculas',
          images: []
        },
        {
          title: 'título em minúsculas',
          content: 'CONTEÚDO EM MAIÚSCULAS',
          images: []
        }
      ];

      const result = await correctionService.correctSlides(slides);

      // Verificar normalização de capitalização
      result.correctedSlides.forEach(slide => {
        expect(slide.title.charAt(0)).toBe(slide.title.charAt(0).toUpperCase());
        expect(slide.content.charAt(0)).toBe(slide.content.charAt(0).toUpperCase());
      });
    });
  });

  describe('Configuração do Serviço', () => {
    it('deve aplicar configurações personalizadas', () => {
      const config = {
        enableTitleGeneration: true,
        enableContentExpansion: false,
        enableImageCorrection: true,
        maxContentLength: 2000,
        maxImagesPerSlide: 8,
        defaultImageAlt: 'Imagem personalizada',
        aggressiveCorrection: true
      };

      correctionService.configure(config);

      const serviceConfig = (correctionService as any).config;
      expect(serviceConfig.enableContentExpansion).toBe(false);
      expect(serviceConfig.maxImagesPerSlide).toBe(8);
      expect(serviceConfig.defaultImageAlt).toBe('Imagem personalizada');
    });

    it('deve usar configuração padrão quando não especificada', () => {
      const newService = AutoCorrectionService.getInstance();
      const config = (newService as any).config;

      expect(config.enableTitleGeneration).toBeDefined();
      expect(config.enableContentExpansion).toBeDefined();
      expect(typeof config.aggressiveCorrection).toBe('boolean');
    });
  });

  describe('Geração de Relatórios', () => {
    it('deve gerar relatório detalhado de correções', () => {
      const correctionResult = {
        summary: {
          totalSlides: 2,
          correctedSlides: 2,
          totalCorrections: 5
        },
        slideResults: [
          {
            slideId: 'slide-1',
            corrections: [
              { type: 'title_generated', description: 'Título gerado automaticamente', severity: 'medium' },
              { type: 'content_expanded', description: 'Conteúdo expandido', severity: 'low' }
            ]
          },
          {
            slideId: 'slide-2',
            corrections: [
              { type: 'image_url_fixed', description: 'URL da imagem corrigida', severity: 'high' },
              { type: 'alt_text_generated', description: 'Texto alternativo gerado', severity: 'medium' },
              { type: 'image_position_fixed', description: 'Posição da imagem ajustada', severity: 'low' }
            ]
          }
        ],
        globalCorrections: ['Dimensões normalizadas entre slides']
      };

      const report = correctionService.generateCorrectionReport(correctionResult);

      expect(report).toContain('Correction Report');
      expect(report).toContain('Total Slides: 2');
      expect(report).toContain('Total Corrections: 5');
      expect(report).toContain('título gerado');
      expect(report).toContain('URL da imagem');
      expect(report).toContain('High Priority');
    });

    it('deve incluir estatísticas por tipo de correção', () => {
      const correctionResult = {
        summary: {
          totalSlides: 3,
          correctedSlides: 3,
          totalCorrections: 6
        },
        slideResults: [
          {
            slideId: 'slide-1',
            corrections: [
              { type: 'title_generated', description: 'Título gerado', severity: 'medium' },
              { type: 'title_generated', description: 'Outro título gerado', severity: 'medium' }
            ]
          },
          {
            slideId: 'slide-2',
            corrections: [
              { type: 'content_expanded', description: 'Conteúdo expandido', severity: 'low' }
            ]
          }
        ],
        globalCorrections: []
      };

      const report = correctionService.generateCorrectionReport(correctionResult);

      expect(report).toContain('title_generated: 2');
      expect(report).toContain('content_expanded: 1');
    });
  });

  describe('Funções Utilitárias', () => {
    it('correctSlideData deve funcionar corretamente', async () => {
      const slides = [
        {
          title: '',
          content: 'Conteúdo sobre análise de dados',
          images: []
        }
      ];

      const result = await correctSlideData(slides);

      expect(result).toBeDefined();
      expect(result.summary.totalSlides).toBe(1);
      expect(result.correctedSlides[0].title).toBeTruthy();
    });

    it('generateCorrectionReport deve funcionar como função standalone', () => {
      const correctionResult = {
        summary: { totalSlides: 1, correctedSlides: 1, totalCorrections: 1 },
        slideResults: [],
        globalCorrections: []
      };

      const report = generateCorrectionReport(correctionResult);

      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });
  });

  describe('Casos Extremos', () => {
    it('deve lidar com slides completamente vazios', async () => {
      const slideVazio = {};

      const result = await correctionService.correctSlide(slideVazio, 0);

      expect(result.correctedSlide.title).toBeTruthy();
      expect(result.correctedSlide.content).toBeTruthy();
      expect(Array.isArray(result.correctedSlide.images)).toBe(true);
      expect(result.corrections.length).toBeGreaterThan(0);
    });

    it('deve lidar com propriedades null/undefined', async () => {
      const slideProblematico = {
        title: null,
        content: undefined,
        images: null
      };

      const result = await correctionService.correctSlide(slideProblematico, 0);

      expect(result.correctedSlide.title).toBeTruthy();
      expect(result.correctedSlide.content).toBeTruthy();
      expect(Array.isArray(result.correctedSlide.images)).toBe(true);
    });

    it('deve lidar com array vazio de slides', async () => {
      const result = await correctionService.correctSlides([]);

      expect(result.summary.totalSlides).toBe(0);
      expect(result.summary.correctedSlides).toBe(0);
      expect(result.correctedSlides).toHaveLength(0);
    });

    it('deve lidar com dados corrompidos', async () => {
      const slideCorrempido = {
        title: { objeto: 'inválido' },
        content: 123,
        images: 'não é array'
      };

      const result = await correctionService.correctSlide(slideCorrempido, 0);

      expect(typeof result.correctedSlide.title).toBe('string');
      expect(typeof result.correctedSlide.content).toBe('string');
      expect(Array.isArray(result.correctedSlide.images)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('deve corrigir muitos slides em tempo razoável', async () => {
      const muitosSlides = Array(50).fill(null).map((_, index) => ({
        title: index % 2 === 0 ? '' : `slide ${index}`,
        content: index % 3 === 0 ? 'Curto' : `Conteúdo do slide ${index} com texto adequado`,
        images: index % 4 === 0 ? [{
          src: 'url-inválida',
          alt: '',
          position: { x: -10, y: -5, width: 0, height: 100 }
        }] : []
      }));

      const startTime = Date.now();
      const result = await correctionService.correctSlides(muitosSlides);
      const processingTime = Date.now() - startTime;

      expect(result.summary.totalSlides).toBe(50);
      expect(processingTime).toBeLessThan(10000); // Menos de 10 segundos
    });

    it('deve ser eficiente com correções complexas', async () => {
      const slideComplexo = {
        title: '',
        content: 'A',
        images: Array(10).fill(null).map((_, index) => ({
          src: 'url-inválida',
          alt: '',
          position: { x: -index, y: -index, width: 0, height: 0 }
        }))
      };

      const startTime = Date.now();
      const result = await correctionService.correctSlide(slideComplexo, 0);
      const processingTime = Date.now() - startTime;

      expect(result.corrections.length).toBeGreaterThan(5);
      expect(processingTime).toBeLessThan(2000); // Menos de 2 segundos
    });
  });
});