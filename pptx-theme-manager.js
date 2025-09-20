// ========== SISTEMA DE TEMAS PPTX ==========

export class PPTXThemeManager {
  constructor() {
    this.themes = new Map();
    this.activeTheme = null;
    this.initializeDefaultThemes();
  }

  initializeDefaultThemes() {
    // Tema Claro
    this.registerTheme('light', {
      name: 'Light Theme',
      colors: {
        primary: '#1a73e8',
        secondary: '#34a853',
        accent: '#fbbc04',
        background: '#ffffff',
        text: {
          primary: '#202124',
          secondary: '#5f6368',
          light: '#ffffff'
        }
      },
      fonts: {
        heading: {
          family: 'Arial',
          weights: [400, 700],
          sizes: {
            h1: 44,
            h2: 32,
            h3: 24
          }
        },
        body: {
          family: 'Calibri',
          weights: [400, 700],
          sizes: {
            normal: 18,
            small: 14,
            large: 24
          }
        }
      },
      spacing: {
        margin: {
          top: 40,
          right: 40,
          bottom: 40,
          left: 40
        },
        padding: {
          small: 8,
          medium: 16,
          large: 24
        },
        lineHeight: 1.5
      },
      effects: {
        shadows: {
          small: {
            blur: 4,
            spread: 0,
            color: 'rgba(0,0,0,0.1)'
          },
          medium: {
            blur: 8,
            spread: 2,
            color: 'rgba(0,0,0,0.15)'
          },
          large: {
            blur: 16,
            spread: 4,
            color: 'rgba(0,0,0,0.2)'
          }
        },
        gradients: {
          primary: {
            type: 'linear',
            stops: [
              { position: 0, color: '#1a73e8' },
              { position: 1, color: '#34a853' }
            ]
          },
          accent: {
            type: 'radial',
            stops: [
              { position: 0, color: '#fbbc04' },
              { position: 1, color: '#ea4335' }
            ]
          }
        }
      },
      layouts: {
        title: {
          elements: [
            {
              type: 'title',
              position: { x: '10%', y: '40%' },
              size: { width: '80%', height: '20%' },
              style: {
                fontSize: 'h1',
                color: 'text.primary',
                align: 'center'
              }
            }
          ]
        },
        content: {
          elements: [
            {
              type: 'title',
              position: { x: '10%', y: '10%' },
              size: { width: '80%', height: '15%' },
              style: {
                fontSize: 'h2',
                color: 'text.primary'
              }
            },
            {
              type: 'content',
              position: { x: '10%', y: '30%' },
              size: { width: '80%', height: '60%' },
              style: {
                fontSize: 'normal',
                color: 'text.secondary'
              }
            }
          ]
        }
      }
    });

    // Tema Escuro
    this.registerTheme('dark', {
      name: 'Dark Theme',
      colors: {
        primary: '#8ab4f8',
        secondary: '#81c995',
        accent: '#fdd663',
        background: '#202124',
        text: {
          primary: '#ffffff',
          secondary: '#9aa0a6',
          light: '#ffffff'
        }
      },
      fonts: {
        heading: {
          family: 'Arial',
          weights: [400, 700],
          sizes: {
            h1: 44,
            h2: 32,
            h3: 24
          }
        },
        body: {
          family: 'Calibri',
          weights: [400, 700],
          sizes: {
            normal: 18,
            small: 14,
            large: 24
          }
        }
      },
      spacing: {
        margin: {
          top: 40,
          right: 40,
          bottom: 40,
          left: 40
        },
        padding: {
          small: 8,
          medium: 16,
          large: 24
        },
        lineHeight: 1.5
      },
      effects: {
        shadows: {
          small: {
            blur: 4,
            spread: 0,
            color: 'rgba(255,255,255,0.1)'
          },
          medium: {
            blur: 8,
            spread: 2,
            color: 'rgba(255,255,255,0.15)'
          },
          large: {
            blur: 16,
            spread: 4,
            color: 'rgba(255,255,255,0.2)'
          }
        },
        gradients: {
          primary: {
            type: 'linear',
            stops: [
              { position: 0, color: '#8ab4f8' },
              { position: 1, color: '#81c995' }
            ]
          },
          accent: {
            type: 'radial',
            stops: [
              { position: 0, color: '#fdd663' },
              { position: 1, color: '#f28b82' }
            ]
          }
        }
      },
      layouts: {
        title: {
          elements: [
            {
              type: 'title',
              position: { x: '10%', y: '40%' },
              size: { width: '80%', height: '20%' },
              style: {
                fontSize: 'h1',
                color: 'text.primary',
                align: 'center'
              }
            }
          ]
        },
        content: {
          elements: [
            {
              type: 'title',
              position: { x: '10%', y: '10%' },
              size: { width: '80%', height: '15%' },
              style: {
                fontSize: 'h2',
                color: 'text.primary'
              }
            },
            {
              type: 'content',
              position: { x: '10%', y: '30%' },
              size: { width: '80%', height: '60%' },
              style: {
                fontSize: 'normal',
                color: 'text.secondary'
              }
            }
          ]
        }
      }
    });

    // Definir tema padrão
    this.setActiveTheme('light');
  }

  registerTheme(id, theme) {
    if (!this.validateTheme(theme)) {
      throw new Error('Tema inválido: estrutura incorreta');
    }

    this.themes.set(id, {
      id,
      ...theme,
      timestamp: Date.now()
    });
  }

  getTheme(id) {
    return this.themes.get(id);
  }

  setActiveTheme(id) {
    const theme = this.getTheme(id);
    if (!theme) {
      throw new Error(`Tema não encontrado: ${id}`);
    }
    this.activeTheme = theme;
  }

  getActiveTheme() {
    return this.activeTheme;
  }

  listThemes() {
    return Array.from(this.themes.values());
  }

  // Métodos de validação
  validateTheme(theme) {
    if (!theme.colors || !theme.fonts || !theme.layouts) {
      return false;
    }

    // Validar cores
    if (!this.validateColors(theme.colors)) {
      return false;
    }

    // Validar fontes
    if (!this.validateFonts(theme.fonts)) {
      return false;
    }

    // Validar layouts
    if (!this.validateLayouts(theme.layouts)) {
      return false;
    }

    return true;
  }

  validateColors(colors) {
    const requiredColors = ['primary', 'secondary', 'background'];
    return requiredColors.every(color => colors[color]);
  }

  validateFonts(fonts) {
    const requiredFonts = ['heading', 'body'];
    return requiredFonts.every(font => {
      const f = fonts[font];
      return f && f.family && f.sizes;
    });
  }

  validateLayouts(layouts) {
    const requiredLayouts = ['title', 'content'];
    return requiredLayouts.every(layout => {
      const l = layouts[layout];
      return l && Array.isArray(l.elements) && l.elements.length > 0;
    });
  }

  // Métodos de aplicação de tema
  applyThemeToSlide(slide) {
    const theme = this.activeTheme;
    if (!theme) {
      throw new Error('Nenhum tema ativo');
    }

    // Aplicar layout
    const layout = theme.layouts[slide.layout] || theme.layouts.content;
    this.applyLayout(slide, layout);

    // Aplicar estilos
    this.applyStyles(slide, theme);

    return slide;
  }

  applyLayout(slide, layout) {
    layout.elements.forEach(element => {
      if (!slide.elements[element.type]) {
        return;
      }

      slide.elements[element.type] = {
        ...slide.elements[element.type],
        position: element.position,
        size: element.size,
        style: this.resolveStyle(element.style)
      };
    });
  }

  applyStyles(slide, theme) {
    // Aplicar cores
    slide.style = {
      ...slide.style,
      background: theme.colors.background,
      color: theme.colors.text.primary
    };

    // Aplicar fontes
    if (slide.elements.title) {
      slide.elements.title.style = {
        ...slide.elements.title.style,
        fontFamily: theme.fonts.heading.family,
        fontSize: theme.fonts.heading.sizes.h1
      };
    }

    if (slide.elements.content) {
      slide.elements.content.style = {
        ...slide.elements.content.style,
        fontFamily: theme.fonts.body.family,
        fontSize: theme.fonts.body.sizes.normal
      };
    }
  }

  resolveStyle(style) {
    const theme = this.activeTheme;
    const resolvedStyle = { ...style };

    // Resolver cores
    if (style.color && typeof style.color === 'string') {
      resolvedStyle.color = this.resolveColor(style.color);
    }

    // Resolver tamanhos de fonte
    if (style.fontSize && typeof style.fontSize === 'string') {
      resolvedStyle.fontSize = this.resolveFontSize(style.fontSize);
    }

    return resolvedStyle;
  }

  resolveColor(colorPath) {
    const theme = this.activeTheme;
    const parts = colorPath.split('.');
    let color = theme.colors;

    for (const part of parts) {
      color = color[part];
      if (!color) {
        return theme.colors.text.primary;
      }
    }

    return color;
  }

  resolveFontSize(sizeKey) {
    const theme = this.activeTheme;
    if (sizeKey.startsWith('h')) {
      return theme.fonts.heading.sizes[sizeKey];
    }
    return theme.fonts.body.sizes[sizeKey] || theme.fonts.body.sizes.normal;
  }

  // Exportação e importação de temas
  exportTheme(id) {
    const theme = this.getTheme(id);
    if (!theme) {
      throw new Error(`Tema não encontrado: ${id}`);
    }

    return JSON.stringify(theme, null, 2);
  }

  importTheme(themeData) {
    try {
      const theme = JSON.parse(themeData);
      if (!this.validateTheme(theme)) {
        throw new Error('Tema inválido');
      }

      this.registerTheme(theme.id || `theme-${Date.now()}`, theme);
    } catch (error) {
      throw new Error(`Erro ao importar tema: ${error.message}`);
    }
  }
}