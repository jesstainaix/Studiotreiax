import { FormatPreservationService, FontFormat, ColorFormat, LayoutFormat } from '../format-preservation.service';

describe('FormatPreservationService', () => {
  let service: FormatPreservationService;
  
  beforeEach(() => {
    service = new FormatPreservationService();
  });

  describe('preserveFormatting', () => {
    it('should preserve complete element formatting', () => {
      const mockElement = {
        tagName: 'DIV',
        id: 'test-element',
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333333',
          backgroundColor: '#f0f0f0',
          width: '200px',
          height: '100px',
          margin: '10px',
          padding: '5px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        },
        getBoundingClientRect: () => ({
          width: 200,
          height: 100,
          top: 50,
          left: 100,
          right: 300,
          bottom: 150
        }),
        getAttribute: (attr: string) => {
          const attrs: Record<string, string> = {
            'data-animation': 'fadeIn',
            'data-duration': '1000'
          };
          return attrs[attr] || null;
        }
      };

      const result = service.preserveFormatting(mockElement as any);
      
      expect(result.elementId).toBe('test-element');
      expect(result.font.family).toBe('Arial, sans-serif');
      expect(result.font.size).toBe('16px');
      expect(result.font.weight).toBe('bold');
      expect(result.colors.text).toBe('#333333');
      expect(result.colors.background).toBe('#f0f0f0');
      expect(result.layout.width).toBe('200px');
      expect(result.layout.height).toBe('100px');
      expect(result.border.width).toBe('1px');
      expect(result.border.style).toBe('solid');
      expect(result.border.color).toBe('#ccc');
      expect(result.animation?.type).toBe('fadeIn');
      expect(result.animation?.duration).toBe(1000);
    });

    it('should handle elements with minimal styling', () => {
      const mockElement = {
        tagName: 'P',
        id: 'minimal-element',
        style: {},
        getBoundingClientRect: () => ({
          width: 100,
          height: 20,
          top: 0,
          left: 0,
          right: 100,
          bottom: 20
        }),
        getAttribute: () => null
      };

      const result = service.preserveFormatting(mockElement as any);
      
      expect(result.elementId).toBe('minimal-element');
      expect(result.font.family).toBe('');
      expect(result.colors.text).toBe('');
      expect(result.layout.width).toBe('100px');
      expect(result.layout.height).toBe('20px');
    });

    it('should extract complex border styling', () => {
      const mockElement = {
        tagName: 'DIV',
        id: 'bordered-element',
        style: {
          border: '2px dashed #ff0000',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        getBoundingClientRect: () => ({
          width: 150,
          height: 75,
          top: 0,
          left: 0,
          right: 150,
          bottom: 75
        }),
        getAttribute: () => null
      };

      const result = service.preserveFormatting(mockElement as any);
      
      expect(result.border.width).toBe('2px');
      expect(result.border.style).toBe('dashed');
      expect(result.border.color).toBe('#ff0000');
      expect(result.border.radius).toBe('8px');
      expect(result.shadow?.blur).toBe('4px');
      expect(result.shadow?.color).toBe('rgba(0,0,0,0.1)');
    });
  });

  describe('generateCSS', () => {
    it('should generate complete CSS from preserved formatting', () => {
      const formatting = {
        elementId: 'test-element',
        font: {
          family: 'Arial, sans-serif',
          size: '16px',
          weight: 'bold',
          style: 'normal',
          variant: 'normal',
          lineHeight: '1.5'
        },
        colors: {
          text: '#333333',
          background: '#f0f0f0',
          border: '#cccccc'
        },
        layout: {
          width: '200px',
          height: '100px',
          margin: '10px',
          padding: '5px',
          position: 'relative',
          top: '0px',
          left: '0px',
          zIndex: 1
        },
        border: {
          width: '1px',
          style: 'solid',
          color: '#cccccc',
          radius: '4px'
        },
        shadow: {
          offsetX: '0px',
          offsetY: '2px',
          blur: '4px',
          spread: '0px',
          color: 'rgba(0,0,0,0.1)',
          inset: false
        },
        animation: {
          type: 'fadeIn',
          duration: 1000,
          delay: 0,
          easing: 'ease-in-out',
          iterations: 1
        }
      };

      const css = service.generateCSS(formatting);
      
      expect(css).toContain('font-family: Arial, sans-serif;');
      expect(css).toContain('font-size: 16px;');
      expect(css).toContain('font-weight: bold;');
      expect(css).toContain('color: #333333;');
      expect(css).toContain('background-color: #f0f0f0;');
      expect(css).toContain('width: 200px;');
      expect(css).toContain('height: 100px;');
      expect(css).toContain('border: 1px solid #cccccc;');
      expect(css).toContain('border-radius: 4px;');
      expect(css).toContain('box-shadow: 0px 2px 4px 0px rgba(0,0,0,0.1);');
      expect(css).toContain('animation: fadeIn 1000ms ease-in-out 0ms 1;');
    });

    it('should generate minimal CSS for basic formatting', () => {
      const formatting = {
        elementId: 'simple-element',
        font: {
          family: 'Arial',
          size: '14px',
          weight: 'normal',
          style: 'normal',
          variant: 'normal',
          lineHeight: '1.2'
        },
        colors: {
          text: '#000000',
          background: '',
          border: ''
        },
        layout: {
          width: '100px',
          height: '50px',
          margin: '0px',
          padding: '0px',
          position: 'static',
          top: '0px',
          left: '0px',
          zIndex: 0
        },
        border: {
          width: '0px',
          style: 'none',
          color: '',
          radius: '0px'
        }
      };

      const css = service.generateCSS(formatting);
      
      expect(css).toContain('font-family: Arial;');
      expect(css).toContain('font-size: 14px;');
      expect(css).toContain('color: #000000;');
      expect(css).toContain('width: 100px;');
      expect(css).toContain('height: 50px;');
      expect(css).not.toContain('background-color:');
      expect(css).not.toContain('border:');
      expect(css).not.toContain('box-shadow:');
    });

    it('should handle CSS class generation', () => {
      const formatting = {
        elementId: 'class-element',
        font: {
          family: 'Helvetica',
          size: '18px',
          weight: 'bold',
          style: 'italic',
          variant: 'small-caps',
          lineHeight: '1.4'
        },
        colors: {
          text: '#ffffff',
          background: '#007acc',
          border: '#005599'
        },
        layout: {
          width: '300px',
          height: '150px',
          margin: '20px auto',
          padding: '15px',
          position: 'absolute',
          top: '100px',
          left: '50px',
          zIndex: 10
        },
        border: {
          width: '2px',
          style: 'solid',
          color: '#005599',
          radius: '8px'
        }
      };

      const css = service.generateCSS(formatting, true);
      
      expect(css).toContain('.class-element {');
      expect(css).toContain('}');
      expect(css).toContain('font-style: italic;');
      expect(css).toContain('font-variant: small-caps;');
      expect(css).toContain('position: absolute;');
      expect(css).toContain('top: 100px;');
      expect(css).toContain('left: 50px;');
      expect(css).toContain('z-index: 10;');
    });
  });

  describe('extractFontFormat', () => {
    it('should extract complete font formatting', () => {
      const mockElement = {
        style: {
          fontFamily: 'Times New Roman, serif',
          fontSize: '20px',
          fontWeight: '600',
          fontStyle: 'italic',
          fontVariant: 'small-caps',
          lineHeight: '1.6',
          textDecoration: 'underline',
          textAlign: 'center',
          textTransform: 'uppercase'
        }
      };

      const result = service.extractFontFormat(mockElement as any);
      
      expect(result.family).toBe('Times New Roman, serif');
      expect(result.size).toBe('20px');
      expect(result.weight).toBe('600');
      expect(result.style).toBe('italic');
      expect(result.variant).toBe('small-caps');
      expect(result.lineHeight).toBe('1.6');
      expect(result.decoration).toBe('underline');
      expect(result.align).toBe('center');
      expect(result.transform).toBe('uppercase');
    });

    it('should handle missing font properties', () => {
      const mockElement = {
        style: {
          fontSize: '16px'
        }
      };

      const result = service.extractFontFormat(mockElement as any);
      
      expect(result.family).toBe('');
      expect(result.size).toBe('16px');
      expect(result.weight).toBe('');
      expect(result.style).toBe('');
    });
  });

  describe('extractColorFormat', () => {
    it('should extract color formatting', () => {
      const mockElement = {
        style: {
          color: 'rgb(255, 0, 0)',
          backgroundColor: 'rgba(0, 255, 0, 0.5)',
          borderColor: '#0000ff'
        }
      };

      const result = service.extractColorFormat(mockElement as any);
      
      expect(result.text).toBe('rgb(255, 0, 0)');
      expect(result.background).toBe('rgba(0, 255, 0, 0.5)');
      expect(result.border).toBe('#0000ff');
    });

    it('should handle missing color properties', () => {
      const mockElement = {
        style: {
          color: '#333333'
        }
      };

      const result = service.extractColorFormat(mockElement as any);
      
      expect(result.text).toBe('#333333');
      expect(result.background).toBe('');
      expect(result.border).toBe('');
    });
  });

  describe('extractLayoutFormat', () => {
    it('should extract layout formatting', () => {
      const mockElement = {
        style: {
          width: '250px',
          height: '125px',
          margin: '15px 10px',
          padding: '8px 12px',
          position: 'fixed',
          top: '75px',
          left: '125px',
          zIndex: '5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        },
        getBoundingClientRect: () => ({
          width: 250,
          height: 125,
          top: 75,
          left: 125,
          right: 375,
          bottom: 200
        })
      };

      const result = service.extractLayoutFormat(mockElement as any);
      
      expect(result.width).toBe('250px');
      expect(result.height).toBe('125px');
      expect(result.margin).toBe('15px 10px');
      expect(result.padding).toBe('8px 12px');
      expect(result.position).toBe('fixed');
      expect(result.top).toBe('75px');
      expect(result.left).toBe('125px');
      expect(result.zIndex).toBe(5);
      expect(result.display).toBe('flex');
      expect(result.flexDirection).toBe('column');
      expect(result.justifyContent).toBe('center');
      expect(result.alignItems).toBe('center');
    });
  });

  describe('optimizeFormatting', () => {
    it('should remove redundant formatting properties', () => {
      const formatting = {
        elementId: 'optimizable-element',
        font: {
          family: 'Arial',
          size: '16px',
          weight: 'normal',
          style: 'normal',
          variant: 'normal',
          lineHeight: '1.2'
        },
        colors: {
          text: '#000000',
          background: '',
          border: ''
        },
        layout: {
          width: '100px',
          height: '50px',
          margin: '0px',
          padding: '0px',
          position: 'static',
          top: '0px',
          left: '0px',
          zIndex: 0
        },
        border: {
          width: '0px',
          style: 'none',
          color: '',
          radius: '0px'
        }
      };

      const optimized = service.optimizeFormatting(formatting);
      
      expect(optimized.font.weight).toBeUndefined();
      expect(optimized.font.style).toBeUndefined();
      expect(optimized.font.variant).toBeUndefined();
      expect(optimized.colors.background).toBeUndefined();
      expect(optimized.colors.border).toBeUndefined();
      expect(optimized.layout.margin).toBeUndefined();
      expect(optimized.layout.padding).toBeUndefined();
      expect(optimized.border).toBeUndefined();
    });

    it('should preserve significant formatting properties', () => {
      const formatting = {
        elementId: 'significant-element',
        font: {
          family: 'Helvetica',
          size: '18px',
          weight: 'bold',
          style: 'italic',
          variant: 'small-caps',
          lineHeight: '1.5'
        },
        colors: {
          text: '#ffffff',
          background: '#007acc',
          border: '#005599'
        },
        layout: {
          width: '200px',
          height: '100px',
          margin: '10px',
          padding: '5px',
          position: 'absolute',
          top: '50px',
          left: '100px',
          zIndex: 5
        },
        border: {
          width: '2px',
          style: 'solid',
          color: '#005599',
          radius: '4px'
        }
      };

      const optimized = service.optimizeFormatting(formatting);
      
      expect(optimized.font.family).toBe('Helvetica');
      expect(optimized.font.weight).toBe('bold');
      expect(optimized.font.style).toBe('italic');
      expect(optimized.colors.text).toBe('#ffffff');
      expect(optimized.colors.background).toBe('#007acc');
      expect(optimized.layout.position).toBe('absolute');
      expect(optimized.border.width).toBe('2px');
    });
  });

  describe('error handling', () => {
    it('should handle null elements gracefully', () => {
      const result = service.preserveFormatting(null as any);
      
      expect(result.elementId).toBe('');
      expect(result.font.family).toBe('');
      expect(result.colors.text).toBe('');
    });

    it('should handle elements without style property', () => {
      const mockElement = {
        tagName: 'DIV',
        id: 'no-style-element',
        getBoundingClientRect: () => ({
          width: 100,
          height: 50,
          top: 0,
          left: 0,
          right: 100,
          bottom: 50
        }),
        getAttribute: () => null
      };

      const result = service.preserveFormatting(mockElement as any);
      
      expect(result.elementId).toBe('no-style-element');
      expect(result.layout.width).toBe('100px');
      expect(result.layout.height).toBe('50px');
    });

    it('should handle invalid CSS values', () => {
      const mockElement = {
        tagName: 'DIV',
        id: 'invalid-css-element',
        style: {
          fontSize: 'invalid-size',
          color: 'not-a-color',
          width: 'auto',
          zIndex: 'not-a-number'
        },
        getBoundingClientRect: () => ({
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }),
        getAttribute: () => null
      };

      const result = service.preserveFormatting(mockElement as any);
      
      expect(result.font.size).toBe('invalid-size');
      expect(result.colors.text).toBe('not-a-color');
      expect(result.layout.width).toBe('auto');
      expect(result.layout.zIndex).toBe(0);
    });
  });

  describe('performance', () => {
    it('should handle large numbers of elements efficiently', () => {
      const elements = Array.from({ length: 100 }, (_, i) => ({
        tagName: 'DIV',
        id: `element-${i}`,
        style: {
          fontSize: `${12 + i % 8}px`,
          color: `#${(i * 123456).toString(16).slice(-6)}`,
          width: `${100 + i * 2}px`,
          height: `${50 + i}px`
        },
        getBoundingClientRect: () => ({
          width: 100 + i * 2,
          height: 50 + i,
          top: i * 10,
          left: i * 5,
          right: 100 + i * 7,
          bottom: 50 + i * 11
        }),
        getAttribute: () => null
      }));

      const startTime = performance.now();
      const results = elements.map(el => service.preserveFormatting(el as any));
      const endTime = performance.now();
      
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      results.forEach((result, i) => {
        expect(result.elementId).toBe(`element-${i}`);
        expect(result.font.size).toBe(`${12 + i % 8}px`);
      });
    });
  });
});