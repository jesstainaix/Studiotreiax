// Sistema de Templates NR - Engine para templates de vídeo neural
import { EventEmitter } from '../utils/EventEmitter';

export interface NRTemplate {
  id: string;
  name: string;
  category: 'educational' | 'corporate' | 'marketing' | 'entertainment' | 'news' | 'tutorial';
  description: string;
  thumbnail: string;
  duration: number;
  resolution: { width: number; height: number };
  frameRate: number;
  elements: TemplateElement[];
  variables: TemplateVariable[];
  style: TemplateStyle;
  metadata: {
    author: string;
    version: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedRenderTime: number;
  };
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'avatar' | 'shape' | 'effect' | 'audio';
  name: string;
  layer: number;
  timeline: {
    startTime: number;
    endTime: number;
    duration: number;
  };
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    scale: number;
  };
  properties: { [key: string]: any };
  animations: ElementAnimation[];
  isVariable: boolean;
  variableId?: string;
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'image' | 'video' | 'color' | 'number' | 'boolean' | 'avatar';
  description: string;
  defaultValue: any;
  constraints?: {
    minLength?: number;
    maxLength?: number;
    allowedFormats?: string[];
    minValue?: number;
    maxValue?: number;
    required?: boolean;
  };
  elementIds: string[];
}

export interface ElementAnimation {
  id: string;
  property: string;
  keyframes: {
    time: number;
    value: any;
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  }[];
  loop: boolean;
  delay: number;
}

export interface TemplateStyle {
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    primaryFont: string;
    secondaryFont: string;
    titleSize: number;
    bodySize: number;
    lineHeight: number;
  };
  effects: {
    transitions: string[];
    filters: string[];
    overlays: string[];
  };
}

export interface ProjectFromTemplate {
  id: string;
  templateId: string;
  name: string;
  variableValues: { [variableId: string]: any };
  customizations: {
    elementId: string;
    property: string;
    value: any;
  }[];
  status: 'draft' | 'ready' | 'rendering' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

class NRTemplateSystem extends EventEmitter {
  private templates: Map<string, NRTemplate> = new Map();
  private projects: Map<string, ProjectFromTemplate> = new Map();
  private isInitialized = false;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    try {
      await this.loadDefaultTemplates();
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async loadDefaultTemplates(): Promise<void> {
    const defaultTemplates: NRTemplate[] = [
      {
        id: 'corporate-intro',
        name: 'Introdução Corporativa',
        category: 'corporate',
        description: 'Template profissional para apresentações corporativas',
        thumbnail: '/templates/corporate-intro.jpg',
        duration: 30,
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        elements: [
          {
            id: 'title-text',
            type: 'text',
            name: 'Título Principal',
            layer: 2,
            timeline: { startTime: 0, endTime: 5, duration: 5 },
            transform: { x: 960, y: 400, width: 800, height: 100, rotation: 0, opacity: 1, scale: 1 },
            properties: {
              text: 'Sua Empresa',
              fontSize: 48,
              fontFamily: 'Arial Bold',
              color: '#ffffff',
              textAlign: 'center'
            },
            animations: [
              {
                id: 'fade-in',
                property: 'opacity',
                keyframes: [
                  { time: 0, value: 0, easing: 'ease-in' },
                  { time: 1, value: 1, easing: 'ease-in' }
                ],
                loop: false,
                delay: 0
              }
            ],
            isVariable: true,
            variableId: 'company-name'
          },
          {
            id: 'logo-image',
            type: 'image',
            name: 'Logo da Empresa',
            layer: 3,
            timeline: { startTime: 0, endTime: 30, duration: 30 },
            transform: { x: 960, y: 200, width: 200, height: 200, rotation: 0, opacity: 1, scale: 1 },
            properties: {
              src: '/placeholders/logo.png',
              preserveAspectRatio: true
            },
            animations: [],
            isVariable: true,
            variableId: 'company-logo'
          }
        ],
        variables: [
          {
            id: 'company-name',
            name: 'Nome da Empresa',
            type: 'text',
            description: 'Nome da sua empresa que aparecerá no título',
            defaultValue: 'Sua Empresa',
            constraints: { maxLength: 50, required: true },
            elementIds: ['title-text']
          },
          {
            id: 'company-logo',
            name: 'Logo da Empresa',
            type: 'image',
            description: 'Logo da sua empresa',
            defaultValue: '/placeholders/logo.png',
            constraints: { allowedFormats: ['png', 'jpg', 'svg'], required: false },
            elementIds: ['logo-image']
          }
        ],
        style: {
          colorPalette: {
            primary: '#2563eb',
            secondary: '#64748b',
            accent: '#f59e0b',
            background: '#1e293b',
            text: '#ffffff'
          },
          typography: {
            primaryFont: 'Arial Bold',
            secondaryFont: 'Arial',
            titleSize: 48,
            bodySize: 24,
            lineHeight: 1.4
          },
          effects: {
            transitions: ['fade', 'slide'],
            filters: ['blur', 'glow'],
            overlays: ['gradient', 'particles']
          }
        },
        metadata: {
          author: 'Studio IA',
          version: '1.0',
          tags: ['corporate', 'professional', 'intro'],
          difficulty: 'beginner',
          estimatedRenderTime: 60
        }
      },
      {
        id: 'educational-lesson',
        name: 'Aula Educacional',
        category: 'educational',
        description: 'Template para conteúdo educacional com avatar',
        thumbnail: '/templates/educational-lesson.jpg',
        duration: 120,
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        elements: [
          {
            id: 'lesson-title',
            type: 'text',
            name: 'Título da Aula',
            layer: 2,
            timeline: { startTime: 0, endTime: 10, duration: 10 },
            transform: { x: 960, y: 150, width: 1200, height: 80, rotation: 0, opacity: 1, scale: 1 },
            properties: {
              text: 'Título da Aula',
              fontSize: 36,
              fontFamily: 'Arial Bold',
              color: '#2563eb',
              textAlign: 'center'
            },
            animations: [],
            isVariable: true,
            variableId: 'lesson-title'
          },
          {
            id: 'avatar-presenter',
            type: 'avatar',
            name: 'Avatar Apresentador',
            layer: 1,
            timeline: { startTime: 10, endTime: 120, duration: 110 },
            transform: { x: 300, y: 540, width: 400, height: 600, rotation: 0, opacity: 1, scale: 1 },
            properties: {
              avatarId: 'default-teacher',
              animation: 'speaking',
              voice: 'pt-br-female'
            },
            animations: [],
            isVariable: true,
            variableId: 'presenter-avatar'
          }
        ],
        variables: [
          {
            id: 'lesson-title',
            name: 'Título da Aula',
            type: 'text',
            description: 'Título principal da aula',
            defaultValue: 'Título da Aula',
            constraints: { maxLength: 100, required: true },
            elementIds: ['lesson-title']
          },
          {
            id: 'presenter-avatar',
            name: 'Avatar Apresentador',
            type: 'avatar',
            description: 'Avatar que apresentará a aula',
            defaultValue: 'default-teacher',
            elementIds: ['avatar-presenter']
          }
        ],
        style: {
          colorPalette: {
            primary: '#2563eb',
            secondary: '#64748b',
            accent: '#10b981',
            background: '#f8fafc',
            text: '#1e293b'
          },
          typography: {
            primaryFont: 'Arial Bold',
            secondaryFont: 'Arial',
            titleSize: 36,
            bodySize: 18,
            lineHeight: 1.5
          },
          effects: {
            transitions: ['fade', 'slide'],
            filters: ['none'],
            overlays: ['subtle-gradient']
          }
        },
        metadata: {
          author: 'Studio IA',
          version: '1.0',
          tags: ['educational', 'avatar', 'lesson'],
          difficulty: 'intermediate',
          estimatedRenderTime: 300
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    this.emit('templatesLoaded', defaultTemplates);
  }

  getTemplates(category?: string): NRTemplate[] {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(t => t.category === category) : templates;
  }

  getTemplate(templateId: string): NRTemplate | undefined {
    return this.templates.get(templateId);
  }

  createProjectFromTemplate(templateId: string, projectName: string): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    const projectId = `project-${Date.now()}`;
    const project: ProjectFromTemplate = {
      id: projectId,
      templateId,
      name: projectName,
      variableValues: {},
      customizations: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Inicializar valores padrão das variáveis
    template.variables.forEach(variable => {
      project.variableValues[variable.id] = variable.defaultValue;
    });

    this.projects.set(projectId, project);
    this.emit('projectCreated', project);
    return projectId;
  }

  updateProjectVariable(projectId: string, variableId: string, value: any): void {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    const template = this.templates.get(project.templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    const variable = template.variables.find(v => v.id === variableId);
    if (!variable) {
      throw new Error('Variável não encontrada');
    }

    // Validar valor
    if (!this.validateVariableValue(variable, value)) {
      throw new Error('Valor inválido para a variável');
    }

    project.variableValues[variableId] = value;
    project.updatedAt = new Date();
    
    this.emit('projectVariableUpdated', { projectId, variableId, value });
  }

  private validateVariableValue(variable: TemplateVariable, value: any): boolean {
    if (variable.constraints?.required && !value) {
      return false;
    }

    if (variable.type === 'text' && typeof value === 'string') {
      if (variable.constraints?.maxLength && value.length > variable.constraints.maxLength) {
        return false;
      }
      if (variable.constraints?.minLength && value.length < variable.constraints.minLength) {
        return false;
      }
    }

    if (variable.type === 'number' && typeof value === 'number') {
      if (variable.constraints?.minValue && value < variable.constraints.minValue) {
        return false;
      }
      if (variable.constraints?.maxValue && value > variable.constraints.maxValue) {
        return false;
      }
    }

    return true;
  }

  customizeElement(projectId: string, elementId: string, property: string, value: any): void {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }
    
    // Remover customização existente para a mesma propriedade
    project.customizations = project.customizations.filter(
      c => !(c.elementId === elementId && c.property === property)
    );
    
    // Adicionar nova customização
    project.customizations.push({ elementId, property, value });
    project.updatedAt = new Date();
    
    this.emit('elementCustomized', { projectId, elementId, property, value });
  }

  generateVideoFromProject(projectId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const project = this.projects.get(projectId);
      if (!project) {
        reject(new Error('Projeto não encontrado'));
        return;
      }

      const template = this.templates.get(project.templateId);
      if (!template) {
        reject(new Error('Template não encontrado'));
        return;
      }

      project.status = 'rendering';
      this.emit('renderStarted', project);

      // Simular renderização
      const renderTime = template.metadata.estimatedRenderTime * 1000;
      
      setTimeout(() => {
        project.status = 'completed';
        const outputPath = `renders/${project.name}_${Date.now()}.mp4`;
        
        this.emit('renderCompleted', { project, outputPath });
        resolve(outputPath);
      }, renderTime);
    });
  }

  getProjects(): ProjectFromTemplate[] {
    return Array.from(this.projects.values());
  }

  getProject(projectId: string): ProjectFromTemplate | undefined {
    return this.projects.get(projectId);
  }

  deleteProject(projectId: string): boolean {
    const deleted = this.projects.delete(projectId);
    if (deleted) {
      this.emit('projectDeleted', projectId);
    }
    return deleted;
  }

  duplicateProject(projectId: string, newName: string): string {
    const originalProject = this.projects.get(projectId);
    if (!originalProject) {
      throw new Error('Projeto não encontrado');
    }

    const newProjectId = `project-${Date.now()}`;
    const newProject: ProjectFromTemplate = {
      ...originalProject,
      id: newProjectId,
      name: newName,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(newProjectId, newProject);
    this.emit('projectDuplicated', { originalId: projectId, newId: newProjectId });
    return newProjectId;
  }

  dispose(): void {
    this.templates.clear();
    this.projects.clear();
    this.isInitialized = false;
    this.emit('disposed');
  }
}

export default NRTemplateSystem;