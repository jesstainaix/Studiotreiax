/**
 * Template Library for Video Projects
 * Provides pre-built templates for different video styles
 */

export interface VideoTemplate {
  id: string
  name: string
  description: string
  category: 'corporate' | 'educational' | 'creative' | 'minimal' | 'dynamic'
  thumbnail: string
  settings: {
    transitions: string[]
    effects: string[]
    colorScheme: {
      primary: string
      secondary: string
      accent: string
    }
    typography: {
      headingFont: string
      bodyFont: string
      sizes: {
        h1: string
        h2: string
        body: string
      }
    }
    layout: {
      padding: string
      spacing: string
      alignment: 'left' | 'center' | 'right'
    }
  }
}

class TemplateLibrary {
  private templates: VideoTemplate[] = [
    {
      id: 'corporate-modern',
      name: 'Corporate Modern',
      description: 'Clean and professional template for business presentations',
      category: 'corporate',
      thumbnail: '/templates/corporate-modern.jpg',
      settings: {
        transitions: ['fade', 'slide'],
        effects: ['subtle-zoom', 'text-reveal'],
        colorScheme: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#f59e0b'
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          sizes: {
            h1: '2.5rem',
            h2: '2rem',
            body: '1rem'
          }
        },
        layout: {
          padding: '2rem',
          spacing: '1.5rem',
          alignment: 'left'
        }
      }
    },
    {
      id: 'educational-friendly',
      name: 'Educational Friendly',
      description: 'Engaging template for educational content',
      category: 'educational',
      thumbnail: '/templates/educational-friendly.jpg',
      settings: {
        transitions: ['bounce', 'zoom'],
        effects: ['highlight', 'pop-in'],
        colorScheme: {
          primary: '#10b981',
          secondary: '#6b7280',
          accent: '#f97316'
        },
        typography: {
          headingFont: 'Poppins',
          bodyFont: 'Open Sans',
          sizes: {
            h1: '2.25rem',
            h2: '1.875rem',
            body: '1.125rem'
          }
        },
        layout: {
          padding: '1.5rem',
          spacing: '1.25rem',
          alignment: 'center'
        }
      }
    },
    {
      id: 'creative-dynamic',
      name: 'Creative Dynamic',
      description: 'Bold and creative template for artistic presentations',
      category: 'creative',
      thumbnail: '/templates/creative-dynamic.jpg',
      settings: {
        transitions: ['rotate', 'scale', 'flip'],
        effects: ['particle', 'gradient-shift', 'morphing'],
        colorScheme: {
          primary: '#8b5cf6',
          secondary: '#ec4899',
          accent: '#06b6d4'
        },
        typography: {
          headingFont: 'Montserrat',
          bodyFont: 'Lato',
          sizes: {
            h1: '3rem',
            h2: '2.25rem',
            body: '1rem'
          }
        },
        layout: {
          padding: '2.5rem',
          spacing: '2rem',
          alignment: 'center'
        }
      }
    }
  ]

  getTemplates(): VideoTemplate[] {
    return this.templates
  }

  getTemplateById(id: string): VideoTemplate | undefined {
    return this.templates.find(template => template.id === id)
  }

  getTemplatesByCategory(category: VideoTemplate['category']): VideoTemplate[] {
    return this.templates.filter(template => template.category === category)
  }

  addTemplate(template: VideoTemplate): void {
    this.templates.push(template)
  }

  removeTemplate(id: string): boolean {
    const index = this.templates.findIndex(template => template.id === id)
    if (index !== -1) {
      this.templates.splice(index, 1)
      return true
    }
    return false
  }
}

export const templateLibrary = new TemplateLibrary()
export default templateLibrary