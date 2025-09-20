// Sistema de templates específicos para Normas Regulamentadoras

// Definições de tipos para VideoProject e VideoLayer
interface VideoProject {
  id: string;
  name: string;
  description: string;
  duration: number;
  resolution: { width: number; height: number };
  frameRate: number;
  fps: number;
  aspectRatio: string;
  timeline: any;
  settings: any;
  layers: VideoLayer[];
  assets: any[];
  metadata: any;
}

interface VideoLayer {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'avatar' | 'scene';
  startTime: number;
  duration: number;
  properties: any;
  visible: boolean;
  locked: boolean;
  effects?: any[];
  opacity?: number;
}

import { AvatarConfig } from './Avatar3DSystem';
import { VFXEffect } from './AdvancedVFXEngine';

// Interfaces para templates de NR
export interface NRTemplate {
  id: string;
  name: string;
  description: string;
  category: NRCategory;
  norma: string;
  version: string;
  duration: number;
  aspectRatio: string;
  resolution: { width: number; height: number };
  scenes: NRScene[];
  assets: NRAsset[];
  compliance: ComplianceInfo;
  customization: TemplateCustomization;
}

export interface NRScene {
  id: string;
  name: string;
  duration: number;
  type: SceneType;
  content: SceneContent;
  transitions: SceneTransition[];
  voiceover: VoiceoverConfig;
  subtitles: SubtitleConfig;
  interactivity?: InteractivityConfig;
}

export interface SceneContent {
  background: BackgroundConfig;
  elements: SceneElement[];
  avatar?: AvatarSceneConfig;
  animations: AnimationConfig[];
  effects: VFXEffect[];
}

export interface SceneElement {
  id: string;
  type: ElementType;
  position: { x: number; y: number; z?: number };
  size: { width: number; height: number };
  content: any;
  animation?: ElementAnimation;
  interactivity?: ElementInteractivity;
}

export interface NRAsset {
  id: string;
  type: AssetType;
  name: string;
  url: string;
  metadata: AssetMetadata;
  compliance: boolean;
}

export interface ComplianceInfo {
  normaNumber: string;
  lastUpdate: string;
  requirements: string[];
  certifications: string[];
  validationRules: ValidationRule[];
}

export interface TemplateCustomization {
  colors: ColorScheme;
  fonts: FontScheme;
  logos: LogoConfig[];
  branding: BrandingConfig;
  content: ContentCustomization;
}

// Enums
export enum NRCategory {
  SEGURANCA_TRABALHO = 'seguranca-trabalho',
  SAUDE_OCUPACIONAL = 'saude-ocupacional',
  MEIO_AMBIENTE = 'meio-ambiente',
  EQUIPAMENTOS = 'equipamentos',
  PROCEDIMENTOS = 'procedimentos',
  EMERGENCIA = 'emergencia',
  TREINAMENTO = 'treinamento',
  ESPACOS_CONFINADOS = 'espacos-confinados',
  PREVENCAO_INCENDIOS = 'prevencao-incendios',
  CONSTRUCAO_CIVIL = 'construcao-civil',
  ERGONOMIA = 'ergonomia'
}

export enum SceneType {
  INTRODUCAO = 'introducao',
  CONCEITOS = 'conceitos',
  PROCEDIMENTOS = 'procedimentos',
  DEMONSTRACAO = 'demonstracao',
  EQUIPAMENTOS = 'equipamentos',
  RISCOS = 'riscos',
  TEORIA = 'teoria',
  QUIZ = 'quiz',
  CONCLUSAO = 'conclusao',
  CERTIFICACAO = 'certificacao',
  INSTALACOES = 'instalacoes',
  PREVENCAO = 'prevencao',
  TREINAMENTO = 'treinamento'
}

export enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  DIAGRAM = 'diagram',
  CHART = 'chart',
  BUTTON = 'button',
  FORM = 'form',
  AVATAR = 'avatar',
  EQUIPMENT_3D = 'equipment-3d',
  EQUIPMENT_SHOWCASE = 'equipment-showcase',
  INTERACTIVE_DIAGRAM = 'interactive-diagram',
  INFO_PANEL = 'info-panel',
  STATISTICS_PANEL = 'statistics-panel',
  INTERACTIVE_GRID = 'interactive-grid',
  FACILITY_LAYOUT = 'facility-layout',
  PROCEDURE_FLOW = 'procedure-flow',
  PREVENTION_GUIDE = 'prevention-guide',
  COMPARISON_LAYOUT = 'comparison-layout'
}

export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  MODEL_3D = 'model-3d',
  DOCUMENT = 'document',
  ANIMATION = 'animation',
  INTERACTIVE = 'interactive'
}

// Configurações específicas
export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image' | 'video' | '3d-environment';
  value: string | GradientConfig | EnvironmentConfig;
}

export interface GradientConfig {
  colors: string[];
  direction: number;
  type: 'linear' | 'radial';
}

export interface EnvironmentConfig {
  scene: string;
  lighting: LightingConfig;
  camera: CameraConfig;
}

export interface AvatarSceneConfig {
  avatarId: string;
  position: { x: number; y: number; z: number };
  animations: string[];
  expressions: string[];
  clothing: string;
  props: string[];
}

export interface VoiceoverConfig {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
  emphasis: EmphasisPoint[];
}

export interface SubtitleConfig {
  enabled: boolean;
  language: string;
  style: SubtitleStyle;
  timing: SubtitleTiming[];
}

export interface InteractivityConfig {
  type: 'click' | 'hover' | 'quiz' | 'form';
  triggers: InteractionTrigger[];
  feedback: FeedbackConfig;
}

// Classes principais
export class NRTemplateSystem {
  private templates: Map<string, NRTemplate> = new Map();
  private categories: Map<NRCategory, NRTemplate[]> = new Map();
  private assets: Map<string, NRAsset> = new Map();
  private customizations: Map<string, TemplateCustomization> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.loadAssetLibrary();
  }

  // Inicialização
  private initializeDefaultTemplates(): void {
    // NR-1: Disposições Gerais
    this.addTemplate(this.createNR10Template());
    
    // NR-5: CIPA
    this.addTemplate(this.createNR35Template());
    
    // NR-6: EPI
    this.addTemplate(this.createNR6Template());
    
    // NR-10: Segurança em Instalações Elétricas
    this.addTemplate(this.createNR10Template());
    
    // NR-12: Segurança no Trabalho em Máquinas
    this.addTemplate(this.createNR12Template());
    
    // NR-17: Ergonomia
    this.addTemplate(this.createNR17Template());
    
    // NR-18: Construção Civil
    this.addTemplate(this.createNR18Template());
    
    // NR-23: Proteção Contra Incêndios
    this.addTemplate(this.createNR23Template());
    
    // NR-33: Espaços Confinados
    this.addTemplate(this.createNR33Template());
    
    // NR-35: Trabalho em Altura
    this.addTemplate(this.createNR35Template());
  }

  private loadAssetLibrary(): void {
    // Carregar biblioteca de assets específicos para NRs
    this.loadSafetyEquipmentAssets();
    this.loadEnvironmentAssets();
    this.loadProcedureAssets();
    this.loadEmergencyAssets();
  }

  // Métodos públicos
  public getTemplatesByCategory(category: NRCategory): NRTemplate[] {
    return this.categories.get(category) || [];
  }

  public getTemplate(id: string): NRTemplate | undefined {
    return this.templates.get(id);
  }

  public getAllTemplates(): NRTemplate[] {
    return Array.from(this.templates.values());
  }

  public searchTemplates(query: string): NRTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.norma.toLowerCase().includes(lowercaseQuery)
    );
  }

  public createCustomTemplate(baseTemplateId: string, customization: TemplateCustomization): NRTemplate {
    const baseTemplate = this.templates.get(baseTemplateId);
    if (!baseTemplate) {
      throw new Error(`Template base ${baseTemplateId} não encontrado`);
    }

    const customTemplate: NRTemplate = {
      ...baseTemplate,
      id: `custom-${Date.now()}`,
      name: `${baseTemplate.name} (Personalizado)`,
      customization: { ...baseTemplate.customization, ...customization }
    };

    this.templates.set(customTemplate.id, customTemplate);
    return customTemplate;
  }

  public generateVideoProject(templateId: string, customization?: Partial<TemplateCustomization>): VideoProject {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }

    const finalCustomization = customization ? 
      { ...template.customization, ...customization } : 
      template.customization;

    return this.convertTemplateToProject(template, finalCustomization);
  }

  public validateCompliance(templateId: string): ComplianceValidationResult {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }

    return this.performComplianceValidation(template);
  }

  // Templates específicos das NRs
  private createNR6Template(): NRTemplate {
    return {
      id: 'nr-6-epi',
      name: 'NR-6: Equipamentos de Proteção Individual',
      description: 'Template completo para treinamento sobre EPIs conforme NR-6',
      category: NRCategory.EQUIPAMENTOS,
      norma: 'NR-6',
      version: '2023.1',
      duration: 1800, // 30 minutos
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      scenes: [
        {
          id: 'intro-nr6',
          name: 'Introdução à NR-6',
          duration: 180,
          type: SceneType.INTRODUCAO,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'industrial-workplace',
                lighting: { type: 'natural', intensity: 0.8 },
                camera: { position: [0, 1.6, 5], target: [0, 1.6, 0] }
              }
            },
            elements: [
              {
                id: 'title-nr6',
                type: ElementType.TEXT,
                position: { x: 960, y: 200 },
                size: { width: 800, height: 100 },
                content: {
                  text: 'NR-6: Equipamentos de Proteção Individual',
                  style: { fontSize: 48, fontWeight: 'bold', color: '#1a365d' }
                },
                animation: {
                  type: 'fadeInUp',
                  duration: 1000,
                  delay: 500
                }
              }
            ],
            avatar: {
              avatarId: 'instrutor-seguranca',
              position: { x: 0, y: 0, z: 0 },
              animations: ['wave-greeting', 'explain-gesture'],
              expressions: ['friendly', 'professional'],
              clothing: 'safety-uniform',
              props: ['safety-helmet', 'clipboard']
            },
            animations: [],
            effects: []
          },
          transitions: [
            {
              type: 'fade',
              duration: 1000,
              easing: 'ease-in-out'
            }
          ],
          voiceover: {
            text: 'Bem-vindos ao treinamento sobre a Norma Regulamentadora 6, que trata dos Equipamentos de Proteção Individual. Neste curso, você aprenderá sobre a importância, tipos e uso correto dos EPIs.',
            voiceId: 'pt-br-male-professional',
            speed: 1.0,
            pitch: 1.0,
            volume: 0.8,
            emphasis: [
              { word: 'Norma Regulamentadora 6', type: 'strong' },
              { word: 'Equipamentos de Proteção Individual', type: 'strong' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 24,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.7)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 3000, text: 'Bem-vindos ao treinamento sobre a Norma Regulamentadora 6' },
              { start: 3000, end: 6000, text: 'que trata dos Equipamentos de Proteção Individual.' }
            ]
          }
        },
        {
          id: 'conceitos-epi',
          name: 'Conceitos Fundamentais',
          duration: 300,
          type: SceneType.CONCEITOS,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#667eea', '#764ba2'],
                direction: 45,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'definition-epi',
                type: ElementType.TEXT,
                position: { x: 960, y: 300 },
                size: { width: 1200, height: 200 },
                content: {
                  text: 'EPI é todo dispositivo ou produto, de uso individual utilizado pelo trabalhador, destinado à proteção de riscos suscetíveis de ameaçar a segurança e a saúde no trabalho.',
                  style: { fontSize: 32, textAlign: 'center', color: '#ffffff' }
                }
              },
              {
                id: 'epi-categories',
                type: ElementType.DIAGRAM,
                position: { x: 960, y: 600 },
                size: { width: 1400, height: 400 },
                content: {
                  type: 'mind-map',
                  central: 'EPIs',
                  branches: [
                    { label: 'Proteção da Cabeça', items: ['Capacete', 'Capuz'] },
                    { label: 'Proteção dos Olhos', items: ['Óculos', 'Protetor Facial'] },
                    { label: 'Proteção Respiratória', items: ['Máscara', 'Respirador'] },
                    { label: 'Proteção das Mãos', items: ['Luvas', 'Mangotes'] },
                    { label: 'Proteção dos Pés', items: ['Botas', 'Sapatos de Segurança'] }
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'instrutor-seguranca',
              position: { x: -2, y: 0, z: 0 },
              animations: ['point-gesture', 'explain-detailed'],
              expressions: ['focused', 'explanatory'],
              clothing: 'safety-uniform',
              props: ['pointer']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'O EPI é definido como todo dispositivo de uso individual destinado à proteção contra riscos que possam ameaçar a segurança e saúde do trabalhador. Existem diferentes categorias de EPIs para cada parte do corpo.',
            voiceId: 'pt-br-male-professional',
            speed: 1.0,
            pitch: 1.0,
            volume: 0.8,
            emphasis: [
              { word: 'dispositivo de uso individual', type: 'strong' },
              { word: 'diferentes categorias', type: 'strong' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 24,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.7)',
              position: 'bottom'
            },
            timing: []
          }
        }
      ],
      assets: [],
      compliance: {
        normaNumber: 'NR-6',
        lastUpdate: '2023-01-01',
        requirements: [
          'Fornecimento gratuito pelo empregador',
          'Treinamento sobre uso correto',
          'Certificado de Aprovação (CA)',
          'Substituição quando danificado'
        ],
        certifications: ['CA - Certificado de Aprovação'],
        validationRules: [
          {
            rule: 'ca-validation',
            description: 'Verificar se todos os EPIs possuem CA válido',
            required: true
          }
        ]
      },
      customization: {
        colors: {
          primary: '#1a365d',
          secondary: '#2d3748',
          accent: '#3182ce',
          background: '#f7fafc',
          text: '#2d3748'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Roboto',
          sizes: { small: 14, medium: 18, large: 24, xlarge: 32 }
        },
        logos: [],
        branding: {
          companyName: '',
          companyLogo: '',
          colors: [],
          watermark: false
        },
        content: {
          language: 'pt-BR',
          terminology: 'technical',
          complexity: 'intermediate',
          examples: 'industry-specific'
        }
      }
    };
  }

  private createNR35Template(): NRTemplate {
    return {
      id: 'nr-35-altura',
      name: 'NR-35: Trabalho em Altura',
      description: 'Template completo para treinamento sobre trabalho em altura conforme NR-35',
      category: NRCategory.SEGURANCA_TRABALHO,
      norma: 'NR-35',
      version: '2023.1',
      duration: 2400, // 40 minutos
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      scenes: [
        {
          id: 'intro-nr35',
          name: 'Introdução ao Trabalho em Altura',
          duration: 240,
          type: SceneType.INTRODUCAO,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'construction-site-height',
                lighting: { type: 'natural', intensity: 1.0 },
                camera: { position: [0, 10, 15], target: [0, 5, 0] }
              }
            },
            elements: [
              {
                id: 'height-definition',
                type: ElementType.TEXT,
                position: { x: 960, y: 150 },
                size: { width: 1000, height: 80 },
                content: {
                  text: 'Trabalho em altura: atividade executada acima de 2,00m do nível inferior',
                  style: { fontSize: 36, fontWeight: 'bold', color: '#c53030' }
                }
              },
              {
                id: 'height-risks',
                type: ElementType.CHART,
                position: { x: 1400, y: 400 },
                size: { width: 400, height: 300 },
                content: {
                  type: 'pie',
                  title: 'Acidentes por Tipo',
                  data: [
                    { label: 'Quedas', value: 65, color: '#e53e3e' },
                    { label: 'Objetos em queda', value: 20, color: '#dd6b20' },
                    { label: 'Choque elétrico', value: 10, color: '#d69e2e' },
                    { label: 'Outros', value: 5, color: '#38a169' }
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'instrutor-altura',
              position: { x: -3, y: 0, z: 0 },
              animations: ['safety-briefing', 'point-upward'],
              expressions: ['serious', 'concerned'],
              clothing: 'safety-harness-uniform',
              props: ['safety-helmet', 'harness', 'lanyard']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'O trabalho em altura é uma das principais causas de acidentes graves na construção civil e indústria. Segundo a NR-35, considera-se trabalho em altura toda atividade executada acima de 2 metros do nível inferior.',
            voiceId: 'pt-br-male-serious',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.8,
            emphasis: [
              { word: '2 metros', type: 'strong' },
              { word: 'principais causas de acidentes', type: 'strong' }
            ],

          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 24,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: []
          },
          interactivity: {
            type: 'quiz',
            triggers: [
              {
                time: 180,
                question: 'A partir de quantos metros de altura se considera trabalho em altura?',
                options: ['1,5m', '2,0m', '2,5m', '3,0m'],
                correct: 1,
                explanation: 'Segundo a NR-35, trabalho em altura é toda atividade executada acima de 2,00m do nível inferior.'
              }
            ],
            feedback: {
              correct: 'Correto! A NR-35 define 2,0m como altura mínima.',
              incorrect: 'Incorreto. A altura mínima é 2,0m conforme NR-35.'
            }
          }
        }
      ],
      assets: [],
      compliance: {
        normaNumber: 'NR-35',
        lastUpdate: '2023-01-01',
        requirements: [
          'Análise de Risco (AR)',
          'Permissão de Trabalho (PT)',
          'Treinamento específico',
          'Equipamentos certificados',
          'Supervisão capacitada'
        ],
        certifications: ['Treinamento NR-35 Básico', 'Treinamento NR-35 Supervisor'],
        validationRules: [
          {
            rule: 'height-measurement',
            description: 'Verificar se a altura está acima de 2,0m',
            required: true
          },
          {
            rule: 'safety-equipment',
            description: 'Verificar uso de equipamentos de proteção',
            required: true
          }
        ]
      },
      customization: {
        colors: {
          primary: '#c53030',
          secondary: '#2d3748',
          accent: '#e53e3e',
          background: '#fff5f5',
          text: '#2d3748'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Roboto',
          sizes: { small: 14, medium: 18, large: 24, xlarge: 32 }
        },
        logos: [],
        branding: {
          companyName: '',
          companyLogo: '',
          colors: [],
          watermark: false
        },
        content: {
          language: 'pt-BR',
          terminology: 'technical',
          complexity: 'advanced',
          examples: 'industry-specific'
        }
      }
    };
  }



  private createNR10Template(): NRTemplate {
    return {
      id: 'nr-10-eletricidade',
      name: 'NR-10: Segurança em Instalações e Serviços em Eletricidade',
      description: 'Template completo para treinamento sobre segurança elétrica conforme NR-10',
      category: NRCategory.SEGURANCA_TRABALHO,
      norma: 'NR-10',
      version: '2023.1',
      duration: 2400, // 40 minutos
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      scenes: [
        {
          id: 'intro-nr10',
          name: 'Introdução à NR-10',
          duration: 300,
          type: SceneType.INTRODUCAO,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#2d3748', '#4a5568'],
                direction: 45,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'nr10-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 200 },
                size: { width: 1200, height: 100 },
                content: {
                  text: 'NR-10: Segurança em Eletricidade',
                  style: { fontSize: 48, fontWeight: 'bold', color: '#ffd700' }
                }
              }
            ],
            avatar: {
              avatarId: 'eletricista-instrutor',
              position: { x: -2, y: 0, z: 0 },
              animations: ['electrical-safety-demo', 'warning-gesture'],
              expressions: ['serious', 'alert'],
              clothing: 'electrical-safety-uniform',
              props: ['multimeter', 'insulated-gloves', 'safety-helmet']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'A eletricidade é uma fonte de energia essencial, mas também representa riscos graves. A NR-10 estabelece os requisitos mínimos para garantir a segurança dos trabalhadores.',
            voiceId: 'pt-br-male-technical',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.8,
            emphasis: [
              { word: 'NR-10', type: 'strong' },
              { word: 'segurança', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: []
          }
        }
      ],
      assets: [],
      compliance: {
        normaNumber: 'NR-10',
        lastUpdate: '2023-01-01',
        requirements: [
          'Treinamento básico obrigatório',
          'Procedimentos de desenergização',
          'Uso de EPI específico',
          'Análise de risco elétrico',
          'Autorização para trabalho'
        ],
        certifications: ['Treinamento NR-10 Básico', 'Treinamento NR-10 SEP'],
        validationRules: [
          {
            rule: 'desenergization-procedure',
            description: 'Verificar conhecimento dos 6 passos de desenergização',
            required: true
          }
        ]
      },
      customization: {
        colors: {
          primary: '#ffd700',
          secondary: '#1a202c',
          accent: '#e53e3e',
          background: '#2d3748',
          text: '#ffffff'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Roboto Mono',
          sizes: { small: 14, medium: 18, large: 24, xlarge: 32 }
        },
        logos: [],
        branding: {
          companyName: '',
          companyLogo: '',
          colors: [],
          watermark: false
        },
        content: {
          language: 'pt-BR',
          terminology: 'technical',
          complexity: 'intermediate',
          examples: 'industry-specific'
        }
      }
    };
  }

  private createNR12Template(): NRTemplate {
    return {
      id: 'nr-12-maquinas',
      name: 'NR-12: Segurança no Trabalho em Máquinas e Equipamentos',
      description: 'Template completo para treinamento sobre segurança em máquinas conforme NR-12',
      category: NRCategory.SEGURANCA_TRABALHO,
      norma: 'NR-12',
      version: '2023.1',
      duration: 2700, // 45 minutos
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      scenes: [
        {
          id: 'intro-nr12',
          name: 'Introdução à NR-12',
          duration: 300,
          type: SceneType.INTRODUCAO,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'industrial-workshop',
                lighting: { type: 'artificial', intensity: 0.9 },
                camera: { position: [0, 2, 5], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'title-nr12',
                type: ElementType.TEXT,
                position: { x: 960, y: 180 },
                size: { width: 1200, height: 120 },
                content: {
                  text: 'NR-12: Segurança em Máquinas e Equipamentos',
                  style: { fontSize: 42, fontWeight: 'bold', color: '#ff6b35' }
                },
                animation: {
                  type: 'slideInLeft',
                  duration: 1500,
                  delay: 200
                }
              },
              {
                id: 'machine-icon',
                type: ElementType.IMAGE,
                position: { x: 1650, y: 250 },
                size: { width: 120, height: 120 },
                content: {
                  src: '/assets/icons/industrial-machine.svg',
                  alt: 'Máquina industrial'
                },
                animation: {
                  type: 'rotateIn',
                  duration: 2000,
                  delay: 800
                }
              }
            ],
            avatar: {
              avatarId: 'tecnico-seguranca',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['safety-presentation', 'point-machine'],
              expressions: ['professional', 'alert'],
              clothing: 'safety-engineer-uniform',
              props: ['safety-helmet', 'clipboard', 'measuring-tape']
            },
            animations: [],
            effects: []
          },
          transitions: [
            {
              type: 'fade',
              duration: 1000,
              easing: 'ease-in-out'
            }
          ],
          voiceover: {
            text: 'A NR-12 estabelece referências técnicas e princípios fundamentais para medidas de proteção em máquinas e equipamentos. Seu objetivo é garantir a saúde e integridade física dos trabalhadores.',
            voiceId: 'pt-br-male-technical',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'NR-12', type: 'strong' },
              { word: 'proteção', type: 'strong' },
              { word: 'integridade física', type: 'emphasis' }
            ],

          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'NR-12: referências técnicas para proteção' },
              { start: 4000, end: 8000, text: 'Garantir saúde e integridade dos trabalhadores' }
            ]
          }
        },
        {
          id: 'principios-protecao',
          name: 'Princípios de Proteção',
          duration: 420,
          type: SceneType.CONCEITOS,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#2c5530', '#4a7c59'],
                direction: 45,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'principles-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 120 },
                size: { width: 1000, height: 80 },
                content: {
                  text: 'Princípios de Proteção em Máquinas',
                  style: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }
                }
              },
              {
                id: 'hierarchy-diagram',
                type: ElementType.DIAGRAM,
                position: { x: 960, y: 500 },
                size: { width: 1400, height: 600 },
                content: {
                  type: 'protection-hierarchy',
                  levels: [
                    {
                      level: 1,
                      title: 'Medidas de Proteção Coletiva',
                      description: 'Proteção integrada ao projeto da máquina',
                      examples: ['Enclausuramento', 'Dispositivos de segurança', 'Sistemas de parada']
                    },
                    {
                      level: 2,
                      title: 'Medidas Administrativas',
                      description: 'Procedimentos e treinamentos',
                      examples: ['Capacitação', 'Procedimentos', 'Sinalização']
                    },
                    {
                      level: 3,
                      title: 'Equipamentos de Proteção Individual',
                      description: 'Última barreira de proteção',
                      examples: ['Luvas', 'Óculos', 'Protetor auricular']
                    }
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'tecnico-seguranca',
              position: { x: -3, y: 0, z: 0 },
              animations: ['explain-hierarchy', 'point-levels'],
              expressions: ['explanatory', 'focused'],
              clothing: 'safety-engineer-uniform',
              props: ['pointer-laser', 'safety-manual']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'A proteção em máquinas segue uma hierarquia de medidas. Primeiro, medidas de proteção coletiva integradas ao projeto. Segundo, medidas administrativas como treinamento. Por último, equipamentos de proteção individual.',
            voiceId: 'pt-br-male-technical',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'hierarquia', type: 'strong' },
              { word: 'proteção coletiva', type: 'strong' },
              { word: 'proteção individual', type: 'strong' }
            ],

          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 5000, text: 'Hierarquia: 1º Proteção coletiva' },
              { start: 5000, end: 10000, text: '2º Medidas administrativas, 3º EPI' }
            ],

          }
        },
        {
          id: 'dispositivos-seguranca',
          name: 'Dispositivos de Segurança',
          duration: 540,
          type: SceneType.PROCEDIMENTOS,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'machine-safety-lab',
                lighting: { type: 'artificial', intensity: 0.9 },
                camera: { position: [3, 2, 4], target: [0, 1, 0] }
              }
            },
            elements: [
              {
                id: 'devices-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 100 },
                size: { width: 1200, height: 60 },
                content: {
                  text: 'Dispositivos de Segurança Obrigatórios',
                  style: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }
                }
              },
              {
                id: 'safety-devices',
                type: ElementType.INTERACTIVE_GRID,
                position: { x: 960, y: 500 },
                size: { width: 1400, height: 700 },
                content: {
                  type: 'machine-safety-demo',
                  devices: [
                    {
                      name: 'Botão de Emergência',
                      description: 'Parada imediata em situações de risco',
                      position: { x: 200, y: 300 },
                      interactive: true
                    },
                    {
                      name: 'Cortina de Luz',
                      description: 'Detecta presença na zona perigosa',
                      position: { x: 600, y: 300 },
                      interactive: true
                    },
                    {
                      name: 'Chave de Segurança',
                      description: 'Impede funcionamento com proteção aberta',
                      position: { x: 1000, y: 300 },
                      interactive: true
                    },
                    {
                      name: 'Tapete de Segurança',
                      description: 'Para máquina quando pisado',
                      position: { x: 1400, y: 300 },
                      interactive: true
                    }
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'tecnico-seguranca',
              position: { x: -2, y: 0, z: 0 },
              animations: ['demonstrate-device', 'safety-check'],
              expressions: ['instructive', 'careful'],
              clothing: 'safety-engineer-uniform',
              props: ['emergency-button', 'safety-key', 'testing-device']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Os dispositivos de segurança são fundamentais para proteção. Botões de emergência para parada imediata, cortinas de luz para detectar presença, chaves de segurança para impedir funcionamento inadequado e tapetes de segurança para áreas críticas.',
            voiceId: 'pt-br-male-technical',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'dispositivos de segurança', type: 'strong' },
              { word: 'parada imediata', type: 'emphasis' },
              { word: 'detectar presença', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Dispositivos fundamentais para proteção' },
              { start: 4000, end: 8000, text: 'Botões, cortinas, chaves e tapetes de segurança' }
            ],

          },
          interactivity: {
            type: 'click',
            triggers: [
              {
                time: 1000,
                question: 'Clique para ver informações do dispositivo',
                options: ['Ver detalhes'],
                correct: 0,
                explanation: 'Informações do dispositivo de segurança'
              }
            ],
            feedback: {
              correct: 'Correto! Você identificou o dispositivo de segurança.',
              incorrect: 'Tente novamente. Observe os dispositivos destacados.'
            }
          }
        },
        {
          id: 'capacitacao-operadores',
          name: 'Capacitação de Operadores',
          duration: 360,
          type: SceneType.TREINAMENTO,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#1e3a8a', '#3b82f6'],
                direction: 180,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'training-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 150 },
                size: { width: 1000, height: 80 },
                content: {
                  text: 'Capacitação Obrigatória de Operadores',
                  style: { fontSize: 34, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }
                }
              },
              {
                id: 'training-requirements',
                type: ElementType.TEXT,
                position: { x: 960, y: 450 },
                size: { width: 1200, height: 400 },
                content: {
                  text: '• Treinamento específico para cada máquina\n• Conhecimento dos riscos e medidas preventivas\n• Procedimentos de trabalho e segurança\n• Situações de emergência\n• Responsabilidades do operador\n• Reciclagem periódica obrigatória',
                  style: { fontSize: 26, color: '#ffffff', lineHeight: 1.8 }
                }
              }
            ],
            avatar: {
              avatarId: 'instrutor-capacitacao',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['teaching-gesture', 'point-requirements'],
              expressions: ['instructive', 'serious'],
              clothing: 'instructor-uniform',
              props: ['training-manual', 'presentation-pointer']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'A capacitação é obrigatória para todos os operadores. Deve incluir treinamento específico para cada máquina, conhecimento dos riscos, procedimentos de segurança, situações de emergência e reciclagem periódica.',
            voiceId: 'pt-br-male-technical',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'capacitação obrigatória', type: 'strong' },
              { word: 'treinamento específico', type: 'strong' },
              { word: 'reciclagem periódica', type: 'emphasis' }
            ],

          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Capacitação obrigatória para operadores' },
              { start: 4000, end: 8000, text: 'Treinamento específico e reciclagem periódica' }
            ]
          }
        },
        {
          id: 'quiz-nr12',
          name: 'Avaliação de Conhecimentos',
          duration: 300,
          type: SceneType.QUIZ,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#7c3aed', '#a855f7'],
                direction: 135,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'quiz-question',
                type: ElementType.TEXT,
                position: { x: 960, y: 280 },
                size: { width: 1200, height: 150 },
                content: {
                  text: 'Qual é a primeira medida na hierarquia de proteção em máquinas?',
                  style: { fontSize: 28, color: '#ffffff', textAlign: 'center' }
                }
              },
              {
                id: 'quiz-options',
                type: ElementType.FORM,
                position: { x: 960, y: 580 },
                size: { width: 900, height: 320 },
                content: {
                  type: 'multiple-choice',
                  options: [
                    'A) Equipamentos de Proteção Individual',
                    'B) Medidas de Proteção Coletiva',
                    'C) Medidas Administrativas',
                    'D) Treinamento dos operadores'
                  ],
                  correct: 1
                }
              }
            ],
            avatar: {
              avatarId: 'tecnico-seguranca',
              position: { x: 0, y: 0, z: 0 },
              animations: ['questioning-pose', 'encouraging-gesture'],
              expressions: ['questioning', 'supportive'],
              clothing: 'safety-engineer-uniform',
              props: ['quiz-clipboard']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Vamos verificar seu aprendizado. Qual é a primeira medida na hierarquia de proteção em máquinas? Lembre-se da ordem de prioridade que estudamos.',
            voiceId: 'pt-br-male-technical',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'primeira medida', type: 'strong' },
              { word: 'hierarquia', type: 'strong' },
              { word: 'ordem de prioridade', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 3000, text: 'Verificando seu aprendizado' },
              { start: 3000, end: 6000, text: 'Primeira medida na hierarquia?' }
            ]
          },
          interactivity: {
            type: 'quiz',
            triggers: [
              {
                time: 2000,
                question: 'Qual é a prioridade na hierarquia de proteção?',
                options: ['Proteção coletiva', 'Proteção individual', 'Medidas administrativas'],
                correct: 0,
                explanation: 'Correto! Medidas de proteção coletiva têm prioridade.'
              }
            ],
            feedback: {
              correct: 'Excelente! As medidas de proteção coletiva são sempre prioritárias.',
              incorrect: 'Incorreto. Lembre-se: proteção coletiva vem primeiro na hierarquia.'
            }
          }
        }
      ],
      assets: [
        {
          id: 'industrial-machine-icon',
          type: AssetType.IMAGE,
          name: 'Ícone de Máquina Industrial',
          url: '/assets/icons/industrial-machine.svg',
          metadata: {
            format: 'svg',
            size: 120,
            tags: ['icon', 'visual']
          },
          compliance: true
        },
        {
          id: 'safety-devices-3d',
          type: AssetType.MODEL_3D,
          name: 'Dispositivos de Segurança 3D',
          url: '/assets/models/safety-devices.glb',
          metadata: {
            format: 'glb',
            size: 2048,
            tags: ['3d-model', 'interactive']
          },
          compliance: true
        }
      ],
      compliance: {
        normaNumber: 'NR-12',
        lastUpdate: '2023-01-01',
        requirements: [
          'Medidas de proteção coletiva prioritárias',
          'Dispositivos de segurança obrigatórios',
          'Capacitação específica de operadores',
          'Procedimentos de trabalho seguro',
          'Manutenção preventiva regular'
        ],
        certifications: ['Operador de Máquinas Certificado', 'Técnico em Segurança de Máquinas'],
        validationRules: [
          {
            rule: 'protection-hierarchy',
            description: 'Verificar conhecimento da hierarquia de proteção',
            required: true
          },
          {
            rule: 'safety-devices',
            description: 'Verificar conhecimento dos dispositivos de segurança',
            required: true
          },
          {
            rule: 'operator-training',
            description: 'Verificar requisitos de capacitação',
            required: true
          }
        ]
      },
      customization: {
        colors: {
          primary: '#ff6b35',
          secondary: '#2c5530',
          accent: '#ffd700',
          background: '#4a7c59',
          text: '#ffffff'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Roboto Mono',
          sizes: { small: 14, medium: 18, large: 24, xlarge: 32 }
        },
        logos: [],
        branding: {
          companyName: '',
          companyLogo: '',
          colors: [],
          watermark: false
        },
        content: {
          language: 'pt-BR',
          terminology: 'technical',
          complexity: 'intermediate',
          examples: 'industry-specific'
        }
      }
    };
  }

  private createNR17Template(): NRTemplate {
    return {
      id: 'nr-17-ergonomia',
      name: 'NR-17: Ergonomia',
      description: 'Template completo para treinamento sobre ergonomia e adaptação das condições de trabalho conforme NR-17',
      category: NRCategory.ERGONOMIA,
      norma: 'NR-17',
      version: '2023.1',
      duration: 2700, // 45 minutos
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      scenes: [
        {
          id: 'intro-nr17',
          name: 'Introdução à Ergonomia',
          duration: 300,
          type: SceneType.INTRODUCAO,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'modern-office-workspace',
                lighting: { type: 'natural', intensity: 0.8 },
                camera: { position: [0, 1.6, 4], target: [0, 1.2, 0] }
              }
            },
            elements: [
              {
                id: 'title-nr17',
                type: ElementType.TEXT,
                position: { x: 960, y: 150 },
                size: { width: 1400, height: 100 },
                content: {
                  text: 'NR-17: Ergonomia no Trabalho',
                  style: { fontSize: 42, fontWeight: 'bold', color: '#7c3aed' }
                },
                animation: {
                  type: 'fadeInDown',
                  duration: 2000,
                  delay: 300
                }
              },
              {
                id: 'ergonomia-definition',
                type: ElementType.TEXT,
                position: { x: 960, y: 280 },
                size: { width: 1200, height: 80 },
                content: {
                  text: 'Adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores',
                  style: { fontSize: 24, color: '#374151', textAlign: 'center' }
                },
                animation: {
                  type: 'fadeIn',
                  duration: 1500,
                  delay: 1000
                }
              },
              {
                id: 'ergonomic-workspace',
                type: ElementType.IMAGE,
                position: { x: 1600, y: 400 },
                size: { width: 250, height: 200 },
                content: {
                  src: '/assets/icons/ergonomic-workspace.svg',
                  alt: 'Posto de Trabalho Ergonômico'
                },
                animation: {
                  type: 'slideInRight',
                  duration: 2000,
                  delay: 1500
                }
              }
            ],
            avatar: {
              avatarId: 'especialista-ergonomia',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['welcome-gesture', 'explain-ergonomics'],
              expressions: ['professional', 'caring'],
              clothing: 'healthcare-professional',
              props: ['ergonomic-assessment-tool', 'posture-guide', 'measurement-device']
            },
            animations: [],
            effects: []
          },
          transitions: [
            {
              type: 'fade',
              duration: 1000,
              easing: 'ease-in-out'
            }
          ],
          voiceover: {
            text: 'A ergonomia busca adaptar o trabalho ao trabalhador, promovendo conforto, segurança e eficiência através da adequação das condições de trabalho às características humanas.',
            voiceId: 'pt-br-female-professional',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'ergonomia', type: 'strong' },
              { word: 'adaptar o trabalho', type: 'strong' },
              { word: 'conforto e segurança', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 24,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Ergonomia: adaptar trabalho ao trabalhador' },
              { start: 4000, end: 8000, text: 'Promover conforto, segurança e eficiência' }
            ]
          }
        },
        {
          id: 'postura-trabalho',
          name: 'Postura e Posicionamento',
          duration: 480,
          type: SceneType.CONCEITOS,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#7c3aed', '#a855f7'],
                direction: 90,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'posture-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 120 },
                size: { width: 1000, height: 80 },
                content: {
                  text: 'Postura Correta no Trabalho',
                  style: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }
                }
              },
              {
                id: 'posture-comparison',
                type: ElementType.COMPARISON_LAYOUT,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 700 },
                content: {
                  type: 'posture-comparison',
                  comparison: {
                    correct: {
                      title: 'Postura Correta',
                      image: '/assets/images/correct-posture.svg',
                      points: [
                        'Pés apoiados no chão ou apoio',
                        'Joelhos em ângulo de 90°',
                        'Costas apoiadas no encosto',
                        'Ombros relaxados',
                        'Braços em ângulo de 90°',
                        'Punhos neutros',
                        'Monitor na altura dos olhos',
                        'Distância de 50-70cm da tela'
                      ],
                      benefits: [
                        'Reduz fadiga muscular',
                        'Previne dores nas costas',
                        'Melhora circulação',
                        'Aumenta produtividade'
                      ]
                    },
                    incorrect: {
                      title: 'Postura Incorreta',
                      image: '/assets/images/incorrect-posture.svg',
                      problems: [
                        'Pés suspensos',
                        'Joelhos em ângulo inadequado',
                        'Costas curvadas',
                        'Ombros elevados',
                        'Braços esticados',
                        'Punhos dobrados',
                        'Monitor muito baixo/alto',
                        'Distância inadequada'
                      ],
                      consequences: [
                        'Dores musculares',
                        'Lesões por esforço repetitivo',
                        'Problemas circulatórios',
                        'Fadiga precoce'
                      ]
                    }
                  }
                }
              }
            ],
            avatar: {
              avatarId: 'fisioterapeuta',
              position: { x: -2, y: 0, z: 0 },
              animations: ['demonstrate-posture', 'point-corrections'],
              expressions: ['instructive', 'caring'],
              clothing: 'healthcare-professional',
              props: ['posture-model', 'measurement-tools', 'correction-guide']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'A postura correta é fundamental para prevenir lesões. Mantenha os pés apoiados, costas retas, braços em 90 graus e o monitor na altura dos olhos.',
            voiceId: 'pt-br-female-professional',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'postura correta', type: 'strong' },
              { word: 'prevenir lesões', type: 'strong' },
              { word: '90 graus', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Postura correta previne lesões' },
              { start: 4000, end: 8000, text: 'Pés apoiados, costas retas, braços 90°' }
            ]
          },
          interactivity: {
            type: 'form',
            triggers: [
              {
                time: 12,
                question: 'Esta postura está correta?',
                options: ['Sim, está adequada', 'Não, precisa ajustar', 'Parcialmente correta', 'Não sei avaliar'],
                correct: 0,
                explanation: 'A postura demonstrada segue os princípios ergonômicos adequados.'
              }
            ],
            feedback: {
              correct: 'Resposta correta!',
              incorrect: 'Revise os conceitos de ergonomia.'
            }
          }
        },
        {
          id: 'ambiente-trabalho',
          name: 'Ambiente de Trabalho Ergonômico',
          duration: 420,
          type: SceneType.PROCEDIMENTOS,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'ergonomic-office-setup',
                lighting: { type: 'artificial', intensity: 0.85 },
                camera: { position: [3, 2, 5], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'environment-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 100 },
                size: { width: 1200, height: 80 },
                content: {
                  text: 'Ambiente de Trabalho Ergonômico',
                  style: { fontSize: 36, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' }
                }
              },
              {
                id: 'environment-factors',
                type: ElementType.INTERACTIVE_DIAGRAM,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 700 },
                content: {
                  type: 'workplace-environment',
                  factors: {
                    lighting: {
                      title: 'Iluminação',
                      requirements: [
                        'Mínimo 500 lux para trabalho de escritório',
                        'Evitar reflexos na tela',
                        'Luz natural complementada por artificial',
                        'Controle individual de intensidade'
                      ],
                      problems: ['Fadiga visual', 'Dores de cabeça', 'Redução da produtividade'],
                      solutions: ['Ajustar posição da tela', 'Usar cortinas/persianas', 'Luminárias direcionais']
                    },
                    temperature: {
                      title: 'Temperatura e Umidade',
                      requirements: [
                        'Temperatura entre 20°C e 23°C',
                        'Umidade relativa entre 40% e 60%',
                        'Velocidade do ar máxima 0,75 m/s',
                        'Controle individual quando possível'
                      ],
                      problems: ['Desconforto térmico', 'Redução da concentração', 'Problemas respiratórios'],
                      solutions: ['Sistema de climatização', 'Ventilação adequada', 'Roupas apropriadas']
                    },
                    noise: {
                      title: 'Ruído',
                      requirements: [
                        'Máximo 65 dB para atividades intelectuais',
                        'Máximo 50 dB para concentração',
                        'Evitar ruídos intermitentes',
                        'Isolamento acústico adequado'
                      ],
                      problems: ['Perda de concentração', 'Estresse', 'Fadiga mental'],
                      solutions: ['Isolamento acústico', 'Equipamentos silenciosos', 'Layout adequado']
                    },
                    space: {
                      title: 'Espaço de Trabalho',
                      requirements: [
                        'Mínimo 6m² por pessoa',
                        'Altura mínima 3m',
                        'Circulação livre',
                        'Organização adequada'
                      ],
                      problems: ['Sensação de confinamento', 'Dificuldade de movimentação', 'Estresse'],
                      solutions: ['Layout otimizado', 'Móveis adequados', 'Organização do espaço']
                    }
                  }
                }
              }
            ],
            avatar: {
              avatarId: 'consultor-ergonomia',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['show-environment', 'measure-conditions'],
              expressions: ['analytical', 'professional'],
              clothing: 'business-casual',
              props: ['measurement-devices', 'environmental-checklist', 'tablet']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'O ambiente ergonômico considera iluminação adequada, temperatura confortável, controle de ruído e espaço suficiente para garantir bem-estar e produtividade.',
            voiceId: 'pt-br-male-professional',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'ambiente ergonômico', type: 'strong' },
              { word: 'bem-estar e produtividade', type: 'strong' },
              { word: 'iluminação adequada', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Ambiente: iluminação, temperatura, ruído' },
              { start: 4000, end: 8000, text: 'Garantir bem-estar e produtividade' }
            ]
          },
          interactivity: {
            type: 'form',
            triggers: [
              {
                time: 8,
                question: 'Qual fator ambiental é mais importante?',
                options: ['Iluminação adequada', 'Ruído excessivo', 'Temperatura extrema', 'Todos são importantes'],
                correct: 3,
                explanation: 'Todos os fatores ambientais são importantes para a ergonomia.'
              }
            ],
            feedback: {
              correct: 'Excelente! Todos os fatores são importantes.',
              incorrect: 'Considere a importância de todos os fatores ambientais.'
            }
          }
        },
        {
          id: 'ler-dort',
          name: 'Prevenção de LER/DORT',
          duration: 360,
          type: SceneType.PREVENCAO,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'medical-consultation-room',
                lighting: { type: 'artificial', intensity: 0.9 },
                camera: { position: [0, 2, 4], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'ler-dort-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 120 },
                size: { width: 1200, height: 80 },
                content: {
                  text: 'Prevenção de LER/DORT',
                  style: { fontSize: 36, fontWeight: 'bold', color: '#dc2626', textAlign: 'center' }
                }
              },
              {
                id: 'prevention-strategies',
                type: ElementType.PREVENTION_GUIDE,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 600 },
                content: {
                  type: 'ler-dort-prevention',
                  strategies: [
                    {
                      category: 'Pausas e Exercícios',
                      actions: [
                        'Pausas de 10 min a cada 50 min de trabalho',
                        'Exercícios de alongamento',
                        'Ginástica laboral',
                        'Variação de atividades'
                      ],
                      frequency: 'Diária',
                      importance: 'Alta'
                    },
                    {
                      category: 'Ajustes do Posto',
                      actions: [
                        'Altura adequada da mesa',
                        'Cadeira ergonômica',
                        'Apoio para punhos',
                        'Monitor na altura correta'
                      ],
                      frequency: 'Permanente',
                      importance: 'Crítica'
                    },
                    {
                      category: 'Técnicas de Trabalho',
                      actions: [
                        'Digitação com toque suave',
                        'Uso alternado das mãos',
                        'Evitar movimentos repetitivos',
                        'Manter punhos neutros'
                      ],
                      frequency: 'Contínua',
                      importance: 'Alta'
                    },
                    {
                      category: 'Monitoramento',
                      actions: [
                        'Avaliação médica periódica',
                        'Relato de sintomas',
                        'Análise ergonômica',
                        'Ajustes preventivos'
                      ],
                      frequency: 'Periódica',
                      importance: 'Média'
                    }
                  ],
                  symptoms: [
                    'Dor ou desconforto',
                    'Formigamento',
                    'Dormência',
                    'Perda de força',
                    'Limitação de movimentos'
                  ],
                  riskFactors: [
                    'Movimentos repetitivos',
                    'Força excessiva',
                    'Posturas inadequadas',
                    'Vibração',
                    'Pressão mecânica'
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'medico-trabalho',
              position: { x: -2, y: 0, z: 0 },
              animations: ['explain-prevention', 'demonstrate-exercises'],
              expressions: ['concerned', 'instructive'],
              clothing: 'medical-professional',
              props: ['anatomical-model', 'exercise-guide', 'assessment-tools']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'A prevenção de LER/DORT envolve pausas regulares, exercícios, ajustes ergonômicos e técnicas adequadas de trabalho. Sintomas devem ser relatados imediatamente.',
            voiceId: 'pt-br-male-professional',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'prevenção', type: 'strong' },
              { word: 'pausas regulares', type: 'strong' },
              { word: 'sintomas', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Prevenção: pausas, exercícios, ajustes' },
              { start: 4000, end: 8000, text: 'Relatar sintomas imediatamente' }
            ]
          },
          interactivity: {
            type: 'form',
            triggers: [
              {
                time: 10,
                question: 'Qual estratégia de prevenção você escolheria?',
                options: ['Pausas regulares', 'Ignorar sintomas', 'Trabalhar mais rápido', 'Manter postura inadequada'],
                correct: 0,
                explanation: 'Pausas regulares são fundamentais para prevenção de LER/DORT.'
              }
            ],
            feedback: {
              correct: 'Estratégia correta selecionada!',
              incorrect: 'Revise as estratégias de prevenção.'
            }
          }
        },
        {
          id: 'quiz-nr17',
          name: 'Avaliação de Conhecimentos',
          duration: 300,
          type: SceneType.QUIZ,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#7c3aed', '#a855f7'],
                direction: 135,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'quiz-question',
                type: ElementType.TEXT,
                position: { x: 960, y: 250 },
                size: { width: 1400, height: 120 },
                content: {
                  text: 'Qual é o ângulo correto para os braços em uma posição ergonômica?',
                  style: { fontSize: 28, color: '#ffffff', textAlign: 'center' }
                }
              },
              {
                id: 'quiz-options',
                type: ElementType.FORM,
                position: { x: 960, y: 580 },
                size: { width: 1000, height: 300 },
                content: {
                  type: 'multiple-choice',
                  options: [
                    'A) 45 graus',
                    'B) 90 graus',
                    'C) 120 graus',
                    'D) 180 graus'
                  ],
                  correct: 1
                }
              }
            ],
            avatar: {
              avatarId: 'especialista-ergonomia',
              position: { x: 0, y: 0, z: 0 },
              animations: ['questioning-pose', 'demonstrate-angle'],
              expressions: ['questioning', 'supportive'],
              clothing: 'healthcare-professional',
              props: ['angle-measurement-tool', 'posture-guide']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Vamos testar seu conhecimento sobre ergonomia. Qual é o ângulo correto para os braços? Lembre-se da postura que estudamos.',
            voiceId: 'pt-br-female-professional',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'ângulo correto', type: 'strong' },
              { word: 'postura', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 3000, text: 'Testando conhecimento sobre ergonomia' },
              { start: 3000, end: 6000, text: 'Ângulo correto dos braços?' }
            ]
          },
          interactivity: {
            type: 'quiz',
            triggers: [
              {
                time: 15,
                question: 'Qual o ângulo ideal para os braços durante o trabalho?',
                options: ['45 graus', '90 graus', '120 graus', '180 graus'],
                correct: 1,
                explanation: '90 graus é o ângulo ideal para evitar tensão muscular.'
              }
            ],
            feedback: {
              correct: 'Excelente! Você entendeu os princípios ergonômicos.',
              incorrect: 'Revise: braços em 90 graus reduzem a tensão muscular.'
            }
          }
        }
      ],
      assets: [
        {
          id: 'ergonomic-workspace-icon',
          type: AssetType.IMAGE,
          name: 'Posto de Trabalho Ergonômico',
          url: '/assets/icons/ergonomic-workspace.svg',
          metadata: {
            format: 'svg',
            size: 250,
            tags: ['icon', 'ergonomic']

          },
          compliance: true
        },
        {
          id: 'posture-comparison-guide',
          type: AssetType.INTERACTIVE,
          name: 'Guia de Comparação Postural',
          url: '/assets/interactive/posture-comparison.json',
          metadata: {
            format: 'interactive-comparison',
            size: 512,
            tags: ['interactive', 'comparison']
          },
          compliance: true
        },
        {
          id: 'ler-dort-prevention-manual',
          type: AssetType.DOCUMENT,
          name: 'Manual de Prevenção LER/DORT',
          url: '/assets/documents/ler-dort-prevention.pdf',
          metadata: {
            format: 'pdf',
            size: 1024,
            tags: ['document', 'prevention']
          },
          compliance: true
        }
      ],
      compliance: {
        normaNumber: 'NR-17',
        lastUpdate: '2023-01-01',
        requirements: [
          'Análise ergonômica do trabalho',
          'Adequação das condições de trabalho',
          'Treinamento em ergonomia',
          'Pausas para descanso',
          'Mobiliário adequado',
          'Condições ambientais apropriadas'
        ],
        certifications: ['Certificado de Treinamento em Ergonomia', 'Avaliação Ergonômica'],
        validationRules: [
          {
            rule: 'posture-knowledge',
            description: 'Verificar conhecimento sobre postura correta',
            required: true
          },
          {
            rule: 'environment-understanding',
            description: 'Verificar compreensão dos fatores ambientais',
            required: true
          },
          {
            rule: 'prevention-awareness',
            description: 'Verificar conhecimento sobre prevenção de LER/DORT',
            required: true
          },
          {
            rule: 'workplace-adjustment',
            description: 'Verificar capacidade de ajustar posto de trabalho',
            required: true
          }
        ]
      },
      customization: {
        colors: {
          primary: '#7c3aed',
          secondary: '#6d28d9',
          accent: '#a855f7',
          background: '#faf5ff',
          text: '#1f2937'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Roboto',
          sizes: { small: 14, medium: 18, large: 24, xlarge: 32 }
        },
        logos: [],
        branding: {
          companyName: '',
          companyLogo: '',
          colors: [],
          watermark: false
        },
        content: {
          language: 'pt-BR',
          terminology: 'technical',
          complexity: 'intermediate',
          examples: 'industry-specific'
        }
      }
    };
  }

  private createNR18Template(): NRTemplate {
    return {
      id: 'nr-18-construcao',
      name: 'NR-18: Condições e Meio Ambiente de Trabalho na Indústria da Construção',
      description: 'Template completo para treinamento sobre segurança e saúde no trabalho na construção civil conforme NR-18',
      category: NRCategory.CONSTRUCAO_CIVIL,
      norma: 'NR-18',
      version: '2023.1',
      duration: 3600, // 60 minutos
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      scenes: [
        {
          id: 'intro-nr18',
          name: 'Introdução à Segurança na Construção Civil',
          duration: 360,
          type: SceneType.INTRODUCAO,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'construction-site-overview',
                lighting: { type: 'natural', intensity: 0.9 },
                camera: { position: [10, 8, 15], target: [0, 2, 0] }
              }
            },
            elements: [
              {
                id: 'title-nr18',
                type: ElementType.TEXT,
                position: { x: 960, y: 120 },
                size: { width: 1600, height: 100 },
                content: {
                  text: 'NR-18: Segurança na Construção Civil',
                  style: { fontSize: 44, fontWeight: 'bold', color: '#dc2626' }
                },
                animation: {
                  type: 'fadeInDown',
                  duration: 2000,
                  delay: 300
                }
              },
              {
                id: 'construction-stats',
                type: ElementType.STATISTICS_PANEL,
                position: { x: 960, y: 300 },
                size: { width: 1400, height: 200 },
                content: {
                  type: 'safety-statistics',
                  stats: [
                    {
                      label: 'Acidentes na Construção',
                      value: '25%',
                      description: 'do total de acidentes de trabalho'
                    },
                    {
                      label: 'Mortes por Quedas',
                      value: '40%',
                      description: 'das mortes na construção civil'
                    },
                    {
                      label: 'Redução com NR-18',
                      value: '60%',
                      description: 'na taxa de acidentes'
                    }
                  ]
                },
                animation: {
                  type: 'slideInUp',
                  duration: 2000,
                  delay: 1000
                }
              },
              {
                id: 'construction-hazards',
                type: ElementType.IMAGE,
                position: { x: 1600, y: 600 },
                size: { width: 280, height: 220 },
                content: {
                  src: '/assets/icons/construction-hazards.svg',
                  alt: 'Riscos na Construção Civil'
                },
                animation: {
                  type: 'slideInRight',
                  duration: 2000,
                  delay: 1500
                }
              }
            ],
            avatar: {
              avatarId: 'engenheiro-seguranca',
              position: { x: -3, y: 0, z: 0 },
              animations: ['welcome-construction', 'point-hazards'],
              expressions: ['serious', 'professional'],
              clothing: 'safety-engineer',
              props: ['hard-hat', 'safety-vest', 'clipboard', 'measuring-tape']
            },
            animations: [],
            effects: []
          },
          transitions: [
            {
              type: 'fade',
              duration: 1200,
              easing: 'ease-in-out'
            }
          ],
          voiceover: {
            text: 'A construção civil é um dos setores com maior índice de acidentes. A NR-18 estabelece diretrizes fundamentais para proteger a vida dos trabalhadores.',
            voiceId: 'pt-br-male-authoritative',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.9,
            emphasis: [
              { word: 'maior índice de acidentes', type: 'strong' },
              { word: 'NR-18', type: 'strong' },
              { word: 'proteger a vida', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 24,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Construção civil: setor com mais acidentes' },
              { start: 4000, end: 8000, text: 'NR-18 protege a vida dos trabalhadores' }
            ]
          }
        },
        {
          id: 'equipamentos-protecao',
          name: 'Equipamentos de Proteção na Construção',
          duration: 480,
          type: SceneType.EQUIPAMENTOS,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'construction-equipment-room',
                lighting: { type: 'artificial', intensity: 0.85 },
                camera: { position: [0, 2, 6], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'epi-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 100 },
                size: { width: 1200, height: 80 },
                content: {
                  text: 'Equipamentos de Proteção Individual',
                  style: { fontSize: 36, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' }
                }
              },
              {
                id: 'construction-epi-grid',
                type: ElementType.INTERACTIVE_GRID,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 700 },
                content: {
                  type: 'construction-epi',
                  equipment: [
                    {
                      name: 'Capacete de Segurança',
                      image: '/assets/equipment/hard-hat.svg',
                      description: 'Proteção contra impactos e quedas de objetos',
                      requirements: [
                        'Classe A ou B conforme risco',
                        'Carneira ajustável',
                        'Jugular quando necessário',
                        'Inspeção diária'
                      ],
                      usage: 'Obrigatório em toda obra',
                      risks: ['Traumatismo craniano', 'Ferimentos na cabeça']
                    },
                    {
                      name: 'Cinturão de Segurança',
                      image: '/assets/equipment/safety-harness.svg',
                      description: 'Proteção contra quedas em altura',
                      requirements: [
                        'Tipo paraquedista para altura >2m',
                        'Inspeção antes do uso',
                        'Ponto de ancoragem seguro',
                        'Trava-quedas quando necessário'
                      ],
                      usage: 'Trabalhos em altura acima de 2m',
                      risks: ['Quedas fatais', 'Lesões graves']
                    },
                    {
                      name: 'Calçado de Segurança',
                      image: '/assets/equipment/safety-boots.svg',
                      description: 'Proteção dos pés contra perfurações e impactos',
                      requirements: [
                        'Biqueira de aço',
                        'Solado antiderrapante',
                        'Resistente a perfuração',
                        'Confortável para uso prolongado'
                      ],
                      usage: 'Obrigatório em toda obra',
                      risks: ['Perfurações', 'Esmagamento', 'Escorregões']
                    },
                    {
                      name: 'Óculos de Proteção',
                      image: '/assets/equipment/safety-glasses.svg',
                      description: 'Proteção ocular contra partículas e radiação',
                      requirements: [
                        'Lentes resistentes a impacto',
                        'Proteção lateral',
                        'Filtro UV quando necessário',
                        'Antiembaçante'
                      ],
                      usage: 'Soldas, cortes, demolições',
                      risks: ['Lesões oculares', 'Cegueira']
                    },
                    {
                      name: 'Luvas de Proteção',
                      image: '/assets/equipment/safety-gloves.svg',
                      description: 'Proteção das mãos conforme atividade',
                      requirements: [
                        'Material adequado ao risco',
                        'Tamanho correto',
                        'Resistência específica',
                        'Flexibilidade para trabalho'
                      ],
                      usage: 'Conforme análise de risco',
                      risks: ['Cortes', 'Queimaduras', 'Dermatoses']
                    },
                    {
                      name: 'Protetor Auricular',
                      image: '/assets/equipment/ear-protection.svg',
                      description: 'Proteção contra ruído excessivo',
                      requirements: [
                        'Atenuação adequada ao ruído',
                        'Conforto para uso prolongado',
                        'Higienização regular',
                        'Substituição periódica'
                      ],
                      usage: 'Ambientes com ruído >85dB',
                      risks: ['Perda auditiva', 'Zumbido']
                    }
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'tecnico-seguranca',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['demonstrate-epi', 'check-equipment'],
              expressions: ['instructive', 'careful'],
              clothing: 'full-safety-gear',
              props: ['epi-checklist', 'inspection-tools']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Os EPIs são fundamentais na construção civil. Capacete, cinturão de segurança, calçados e demais equipamentos devem ser usados conforme os riscos de cada atividade.',
            voiceId: 'pt-br-male-professional',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'EPIs são fundamentais', type: 'strong' },
              { word: 'conforme os riscos', type: 'strong' },
              { word: 'cada atividade', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'EPIs fundamentais na construção' },
              { start: 4000, end: 8000, text: 'Uso conforme riscos da atividade' }
            ]
          },
          interactivity: {
            type: 'form',
            triggers: [
              {
                time: 0,
                question: 'Verificar equipamento',
                options: ['Sim', 'Não'],
                correct: 0,
                explanation: 'Equipamento verificado'
              }
            ],
            feedback: {
              correct: 'Equipamento verificado!',
              incorrect: 'Verificar novamente.'
            }
          }
        },
        {
          id: 'trabalho-altura',
          name: 'Trabalho em Altura na Construção',
          duration: 540,
          type: SceneType.PROCEDIMENTOS,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'construction-height-work',
                lighting: { type: 'natural', intensity: 0.8 },
                camera: { position: [8, 12, 20], target: [0, 8, 0] }
              }
            },
            elements: [
              {
                id: 'height-work-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 100 },
                size: { width: 1400, height: 80 },
                content: {
                  text: 'Trabalho em Altura - Procedimentos de Segurança',
                  style: { fontSize: 34, fontWeight: 'bold', color: '#dc2626', textAlign: 'center' }
                }
              },
              {
                id: 'height-procedures',
                type: ElementType.PROCEDURE_FLOW,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 700 },
                content: {
                  type: 'height-work-procedures',
                  procedures: [
                    {
                      step: 1,
                      title: 'Análise Preliminar de Risco',
                      description: 'Identificar todos os riscos antes do início',
                      actions: [
                        'Avaliar condições climáticas',
                        'Verificar estrutura de apoio',
                        'Identificar riscos de queda',
                        'Definir medidas de proteção',
                        'Elaborar Permissão de Trabalho'
                      ],
                      critical: true
                    },
                    {
                      step: 2,
                      title: 'Sistemas de Proteção Coletiva',
                      description: 'Priorizar proteção coletiva sobre individual',
                      actions: [
                        'Instalar guarda-corpos',
                        'Colocar redes de proteção',
                        'Usar plataformas elevatórias',
                        'Instalar telas de proteção',
                        'Sinalizar área de risco'
                      ],
                      critical: true
                    },
                    {
                      step: 3,
                      title: 'Equipamentos de Proteção Individual',
                      description: 'Usar EPIs adequados quando proteção coletiva for insuficiente',
                      actions: [
                        'Cinturão tipo paraquedista',
                        'Trava-quedas retrátil',
                        'Ponto de ancoragem seguro',
                        'Capacete com jugular',
                        'Calçado antiderrapante'
                      ],
                      critical: true
                    },
                    {
                      step: 4,
                      title: 'Supervisão e Monitoramento',
                      description: 'Acompanhar continuamente o trabalho',
                      actions: [
                        'Supervisor capacitado presente',
                        'Comunicação constante',
                        'Monitorar condições climáticas',
                        'Verificar equipamentos',
                        'Plano de resgate definido'
                      ],
                      critical: false
                    }
                  ],
                  heightLimits: {
                    'Proteção obrigatória': '2 metros',
                    'Treinamento específico': 'Acima de 2 metros',
                    'Supervisão intensiva': 'Acima de 10 metros',
                    'Plano de resgate': 'Todos os trabalhos'
                  },
                  commonHazards: [
                    'Quedas de pessoas',
                    'Quedas de materiais',
                    'Condições climáticas',
                    'Estruturas instáveis',
                    'Fadiga do trabalhador'
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'supervisor-altura',
              position: { x: -3, y: 0, z: 0 },
              animations: ['demonstrate-height-safety', 'check-harness'],
              expressions: ['serious', 'vigilant'],
              clothing: 'full-height-safety-gear',
              props: ['safety-harness', 'inspection-checklist', 'radio']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Trabalho em altura requer análise de risco, proteção coletiva prioritária, EPIs adequados e supervisão constante. A segurança não pode ser negligenciada.',
            voiceId: 'pt-br-male-authoritative',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.9,
            emphasis: [
              { word: 'análise de risco', type: 'strong' },
              { word: 'proteção coletiva prioritária', type: 'strong' },
              { word: 'não pode ser negligenciada', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Altura: análise, proteção, supervisão' },
              { start: 4000, end: 8000, text: 'Segurança não pode ser negligenciada' }
            ]
          },
          interactivity: {
            type: 'form',
            triggers: [
              {
                time: 0,
                question: 'Verificar procedimento',
                options: ['Sim', 'Não'],
                correct: 0,
                explanation: 'Procedimento verificado'
              }
            ],
            feedback: {
              correct: 'Procedimento verificado!',
              incorrect: 'Verificar novamente.'
            }
          }
        },
        {
          id: 'areas-vivencia',
          name: 'Áreas de Vivência',
          duration: 300,
          type: SceneType.INSTALACOES,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'construction-living-areas',
                lighting: { type: 'natural', intensity: 0.85 },
                camera: { position: [5, 3, 8], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'living-areas-title',
                type: ElementType.TEXT,
                position: { x: 960, y: 120 },
                size: { width: 1200, height: 80 },
                content: {
                  text: 'Áreas de Vivência na Obra',
                  style: { fontSize: 36, fontWeight: 'bold', color: '#059669', textAlign: 'center' }
                }
              },
              {
                id: 'living-areas-layout',
                type: ElementType.FACILITY_LAYOUT,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 600 },
                content: {
                  type: 'construction-living-areas',
                  areas: {
                    dining: {
                      name: 'Refeitório',
                      requirements: [
                        'Área mínima: 1m² por usuário',
                        'Pé-direito mínimo: 2,80m',
                        'Ventilação adequada',
                        'Mesas e bancos suficientes',
                        'Lavatório para higiene',
                        'Aquecedor de refeições'
                      ],
                      capacity: 'Conforme número de trabalhadores'
                    },
                    restrooms: {
                      name: 'Instalações Sanitárias',
                      requirements: [
                        '1 vaso para cada 20 trabalhadores',
                        '1 mictório para cada 10 trabalhadores',
                        '1 lavatório para cada 10 trabalhadores',
                        '1 chuveiro para cada 10 trabalhadores',
                        'Água quente nos chuveiros',
                        'Ventilação adequada'
                      ],
                      capacity: 'Proporção por trabalhadores'
                    },
                    changing: {
                      name: 'Vestiário',
                      requirements: [
                        'Área mínima: 1,50m² por usuário',
                        'Pé-direito mínimo: 2,50m',
                        'Armários individuais',
                        'Bancos para troca',
                        'Ventilação cruzada',
                        'Separação por sexo'
                      ],
                      capacity: 'Todos os trabalhadores'
                    },
                    rest: {
                      name: 'Área de Descanso',
                      requirements: [
                        'Local coberto e ventilado',
                        'Bancos ou assentos',
                        'Proteção contra intempéries',
                        'Água potável disponível',
                        'Lixeiras adequadas'
                      ],
                      capacity: 'Pausas e intervalos'
                    }
                  },
                  generalRequirements: [
                    'Construção em material resistente',
                    'Pisos impermeáveis e laváveis',
                    'Paredes lisas e laváveis',
                    'Cobertura adequada',
                    'Iluminação natural e artificial',
                    'Instalações elétricas seguras'
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'arquiteto-obras',
              position: { x: -2, y: 0, z: 0 },
              animations: ['show-facilities', 'measure-areas'],
              expressions: ['professional', 'explanatory'],
              clothing: 'architect-safety',
              props: ['blueprints', 'measuring-tape', 'tablet']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'As áreas de vivência garantem condições dignas aos trabalhadores. Refeitório, sanitários, vestiários e áreas de descanso devem atender às especificações da NR-18.',
            voiceId: 'pt-br-female-professional',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'condições dignas', type: 'strong' },
              { word: 'especificações da NR-18', type: 'strong' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Áreas de vivência: condições dignas' },
              { start: 4000, end: 8000, text: 'Conforme especificações NR-18' }
            ]
          },
          interactivity: {
            type: 'click',
            triggers: [
              {
                time: 0,
                question: 'Verificar área',
                options: ['Sim', 'Não'],
                correct: 0,
                explanation: 'Área verificada'
              }
            ],
            feedback: {
              correct: 'Área verificada!',
              incorrect: 'Verificar novamente.'
            }
          }
        },
        {
          id: 'quiz-nr18',
          name: 'Avaliação de Conhecimentos',
          duration: 420,
          type: SceneType.QUIZ,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#dc2626', '#ef4444'],
                direction: 135,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'quiz-question',
                type: ElementType.TEXT,
                position: { x: 960, y: 200 },
                size: { width: 1400, height: 120 },
                content: {
                  text: 'A partir de qual altura é obrigatório o uso de cinturão de segurança na construção civil?',
                  style: { fontSize: 26, color: '#ffffff', textAlign: 'center' }
                }
              },
              {
                id: 'quiz-options',
                type: ElementType.FORM,
                position: { x: 960, y: 500 },
                size: { width: 1000, height: 350 },
                content: {
                  type: 'multiple-choice',
                  options: [
                    'A) 1 metro',
                    'B) 1,5 metros',
                    'C) 2 metros',
                    'D) 3 metros'
                  ],
                  correct: 2
                }
              }
            ],
            avatar: {
              avatarId: 'engenheiro-seguranca',
              position: { x: 0, y: 0, z: 0 },
              animations: ['questioning-pose', 'show-height'],
              expressions: ['questioning', 'serious'],
              clothing: 'safety-engineer',
              props: ['measuring-tape', 'safety-manual']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Vamos testar seu conhecimento sobre trabalho em altura. A partir de qual altura é obrigatório usar cinturão de segurança? Lembre-se das normas que estudamos.',
            voiceId: 'pt-br-male-professional',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.85,
            emphasis: [
              { word: 'trabalho em altura', type: 'strong' },
              { word: 'cinturão de segurança', type: 'strong' },
              { word: 'normas', type: 'emphasis' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Testando conhecimento sobre altura' },
              { start: 4000, end: 8000, text: 'Altura obrigatória para cinturão?' }
            ]
          },
          interactivity: {
            type: 'quiz',
            triggers: [
              {
                time: 0,
                question: 'A partir de qual altura é obrigatório o cinturão?',
                options: ['1m', '1,5m', '2m', '3m'],
                correct: 2,
                explanation: 'A partir de 2 metros é obrigatório'
              }
            ],
            feedback: {
              correct: 'Excelente! Você conhece as normas de segurança.',
              incorrect: 'Revise: 2 metros é o limite para proteção obrigatória.'
            }
          }
        }
      ],
      assets: [
        {
          id: 'construction-hazards-icon',
          type: AssetType.IMAGE,
          name: 'Riscos na Construção Civil',
          url: '/assets/icons/construction-hazards.svg',
          metadata: {
            format: 'svg',
            size: 280,
            tags: ['visual', 'reference']
          },
          compliance: true
        },
        {
          id: 'height-safety-procedures',
          type: AssetType.INTERACTIVE,
          name: 'Procedimentos de Segurança em Altura',
          url: '/assets/interactive/height-safety-procedures.json',
          metadata: {
            format: 'interactive-flow',
            size: 1024,
            tags: ['interactive', 'training']
          },
          compliance: true
        },
        {
          id: 'construction-epi-manual',
          type: AssetType.DOCUMENT,
          name: 'Manual de EPIs para Construção',
          url: '/assets/documents/construction-epi-manual.pdf',
          metadata: {
            format: 'pdf',
            size: 2048,
            tags: ['reference', 'document']
          },
          compliance: true
        }
      ],
      compliance: {
        normaNumber: 'NR-18',
        lastUpdate: '2023-01-01',
        requirements: [
          'Programa de Condições e Meio Ambiente de Trabalho na Indústria da Construção (PCMAT)',
          'Áreas de vivência adequadas',
          'Equipamentos de proteção individual',
          'Proteção contra quedas',
          'Proteção contra soterramentos',
          'Instalações elétricas seguras',
          'Máquinas e equipamentos seguros',
          'Explosivos controlados'
        ],
        certifications: ['Certificado NR-18', 'Treinamento em Altura', 'PCMAT'],
        validationRules: [
          {
            rule: 'height-safety-knowledge',
            description: 'Verificar conhecimento sobre trabalho em altura',
            required: true
          },
          {
            rule: 'epi-usage-understanding',
            description: 'Verificar compreensão do uso correto de EPIs',
            required: true
          },
          {
            rule: 'living-areas-requirements',
            description: 'Verificar conhecimento sobre áreas de vivência',
            required: true
          },
          {
            rule: 'hazard-identification',
            description: 'Verificar capacidade de identificar riscos',
            required: true
          }
        ]
      },
      customization: {
        colors: {
          primary: '#dc2626',
          secondary: '#b91c1c',
          accent: '#ef4444',
          background: '#fef2f2',
          text: '#1f2937'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Roboto',
          sizes: { small: 14, medium: 18, large: 24, xlarge: 32 }
        },
        logos: [],
        branding: {
          companyName: '',
          companyLogo: '',
          colors: [],
          watermark: false
        },
        content: {
          language: 'pt-BR',
          terminology: 'technical',
          complexity: 'intermediate',
          examples: 'industry-specific'
        }
      }
    };
  }

  private createNR23Template(): NRTemplate {
    return {
      id: 'nr-23-incendios',
      name: 'NR-23: Proteção Contra Incêndios',
      description: 'Template completo para treinamento sobre proteção e combate a incêndios conforme NR-23',
      category: NRCategory.PREVENCAO_INCENDIOS,
      norma: 'NR-23',
      version: '2023.1',
      duration: 2700, // 45 minutos
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      scenes: [
        {
          id: 'intro-nr23',
          name: 'Introdução à Proteção Contra Incêndios',
          duration: 300,
          type: SceneType.INTRODUCAO,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'fire-safety-training-room',
                lighting: { type: 'artificial', intensity: 0.8 },
                camera: { position: [5, 2, 8], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'title-nr23',
                type: ElementType.TEXT,
                position: { x: 960, y: 120 },
                size: { width: 1600, height: 100 },
                content: {
                  text: 'NR-23: Proteção Contra Incêndios',
                  style: { fontSize: 44, fontWeight: 'bold', color: '#dc2626' }
                },
                animation: {
                  type: 'fadeInDown',
                  duration: 2000,
                  delay: 300
                }
              },
              {
                id: 'fire-statistics',
                type: ElementType.STATISTICS_PANEL,
                position: { x: 960, y: 300 },
                size: { width: 1400, height: 200 },
                content: {
                  type: 'fire-safety-statistics',
                  stats: [
                    {
                      label: 'Incêndios no Trabalho',
                      value: '15%',
                      description: 'dos acidentes graves'
                    },
                    {
                      label: 'Mortes por Incêndio',
                      value: '80%',
                      description: 'por inalação de fumaça'
                    },
                    {
                      label: 'Prevenção Eficaz',
                      value: '90%',
                      description: 'dos incêndios são evitáveis'
                    }
                  ]
                },
                animation: {
                  type: 'slideInUp',
                  duration: 2000,
                  delay: 1000
                }
              }
            ],
            avatar: {
              avatarId: 'bombeiro-instrutor',
              position: { x: -3, y: 0, z: 0 },
              animations: ['welcome-fire-safety', 'demonstrate-triangle'],
              expressions: ['serious', 'professional'],
              clothing: 'fire-safety-instructor',
              props: ['fire-extinguisher', 'safety-helmet']
            },
            animations: [],
            effects: []
          },
          transitions: [
            {
              type: 'fade',
              duration: 1200,
              easing: 'ease-in-out'
            }
          ],
          voiceover: {
            text: 'A proteção contra incêndios é fundamental para preservar vidas e patrimônio. A NR-23 estabelece medidas de prevenção, combate e evacuação.',
            voiceId: 'pt-br-male-authoritative',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.9,
            emphasis: [
              { word: 'preservar vidas', type: 'strong' },
              { word: 'NR-23', type: 'strong' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 24,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Proteção contra incêndios preserva vidas' },
              { start: 4000, end: 8000, text: 'NR-23: prevenção, combate e evacuação' }
            ]
          }
        },
        {
          id: 'triangulo-fogo',
          name: 'Triângulo do Fogo e Combustão',
          duration: 360,
          type: SceneType.TEORIA,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'fire-science-lab',
                lighting: { type: 'artificial', intensity: 0.85 },
                camera: { position: [0, 2, 6], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'fire-triangle-interactive',
                type: ElementType.INTERACTIVE_DIAGRAM,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 700 },
                content: {
                  type: 'fire-triangle',
                  elements: {
                    combustivel: {
                      name: 'Combustível',
                      description: 'Material que pode queimar',
                      examples: ['Madeira, papel', 'Líquidos inflamáveis', 'Gases']
                    },
                    comburente: {
                      name: 'Comburente',
                      description: 'Oxigênio que alimenta a combustão',
                      characteristics: ['Oxigênio do ar (21%)', 'Mínimo 16%']
                    },
                    calor: {
                      name: 'Calor',
                      description: 'Energia que inicia a combustão',
                      sources: ['Chamas', 'Faíscas', 'Atrito']
                    }
                  }
                }
              }
            ],
            avatar: {
              avatarId: 'instrutor-tecnico',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['explain-triangle'],
              expressions: ['instructive'],
              clothing: 'technical-instructor',
              props: ['pointer', 'fire-model']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'O fogo precisa de três elementos: combustível, oxigênio e calor. Removendo qualquer um deles, extinguimos o incêndio.',
            voiceId: 'pt-br-male-professional',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: []
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Fogo: combustível + oxigênio + calor' }
            ]
          }
        },
        {
          id: 'extintores-tipos',
          name: 'Tipos de Extintores',
          duration: 480,
          type: SceneType.EQUIPAMENTOS,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'fire-equipment-room',
                lighting: { type: 'artificial', intensity: 0.85 },
                camera: { position: [0, 2, 8], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'extinguishers-grid',
                type: ElementType.INTERACTIVE_GRID,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 700 },
                content: {
                  type: 'fire-extinguishers',
                  equipment: [
                    {
                      name: 'Extintor de Água',
                      color: 'red',
                      classes: ['A'],
                      applications: ['Madeira', 'Papel', 'Tecidos']
                    },
                    {
                      name: 'Extintor de CO2',
                      color: 'black',
                      classes: ['B', 'C'],
                      applications: ['Equipamentos elétricos', 'Líquidos']
                    },
                    {
                      name: 'Extintor de Pó Químico',
                      color: 'blue',
                      classes: ['B', 'C'],
                      applications: ['Líquidos', 'Gases']
                    }
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'especialista-extintores',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['demonstrate-extinguisher'],
              expressions: ['professional'],
              clothing: 'fire-safety-expert',
              props: ['various-extinguishers']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Cada tipo de extintor é específico para determinadas classes de incêndio. Usar o extintor errado pode ser perigoso.',
            voiceId: 'pt-br-male-professional',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: []
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Extintor específico para cada classe' }
            ]
          }
        },
        {
          id: 'quiz-nr23',
          name: 'Avaliação de Conhecimentos',
          duration: 360,
          type: SceneType.QUIZ,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#dc2626', '#ef4444'],
                direction: 135,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'quiz-question',
                type: ElementType.TEXT,
                position: { x: 960, y: 200 },
                size: { width: 1400, height: 120 },
                content: {
                  text: 'Qual extintor deve ser usado em equipamentos elétricos?',
                  style: { fontSize: 26, color: '#ffffff', textAlign: 'center' }
                }
              },
              {
                id: 'quiz-options',
                type: ElementType.FORM,
                position: { x: 960, y: 500 },
                size: { width: 1000, height: 350 },
                content: {
                  type: 'multiple-choice',
                  options: [
                    'A) Extintor de água',
                    'B) Extintor de espuma',
                    'C) Extintor de CO2',
                    'D) Extintor de pó químico'
                  ],
                  correct: 2
                }
              }
            ],
            avatar: {
              avatarId: 'instrutor-avaliacao',
              position: { x: 0, y: 0, z: 0 },
              animations: ['questioning-pose'],
              expressions: ['questioning'],
              clothing: 'fire-safety-instructor',
              props: ['extinguisher-models']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Qual tipo de extintor deve ser usado em equipamentos elétricos energizados?',
            voiceId: 'pt-br-male-professional',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.85,
            emphasis: []
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Extintor para equipamentos elétricos?' }
            ]
          },
          interactivity: {
            type: 'quiz',
            triggers: [
              {
                time: 0,
                question: 'Qual extintor usar?',
                options: ['Água', 'CO2', 'Espuma'],
                correct: 1,
                explanation: 'CO2 não conduz eletricidade'
              }
            ],
            feedback: {
              correct: 'Correto!',
              incorrect: 'Incorreto.'
            }
          }
        }
      ],
      assets: [
        {
          id: 'fire-triangle-diagram',
          type: AssetType.IMAGE,
          name: 'Diagrama do Triângulo do Fogo',
          url: '/assets/icons/fire-triangle.svg',
          metadata: {
            format: 'svg',
            size: 280,
            tags: ['educational-diagram']
          },
          compliance: true
        }
      ],
      compliance: {
        normaNumber: 'NR-23',
        lastUpdate: '2023-01-01',
        requirements: [
          'Saídas de emergência adequadas',
          'Equipamentos de combate a incêndio',
          'Sistema de alarme',
          'Brigada de incêndio treinada'
        ],
        certifications: ['Certificado NR-23', 'Brigada de Incêndio'],
        validationRules: [
          {
            rule: 'fire-triangle-knowledge',
            description: 'Verificar conhecimento sobre elementos da combustão',
            required: true
          },
          {
            rule: 'extinguisher-selection',
            description: 'Verificar capacidade de selecionar extintor adequado',
            required: true
          }
        ]
      },
      customization: {
        colors: {
          primary: '#dc2626',
          secondary: '#b91c1c',
          accent: '#ef4444',
          background: '#fef2f2',
          text: '#1f2937'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Roboto',
          sizes: { small: 14, medium: 18, large: 24, xlarge: 32 }
        },
        logos: [],
        branding: {
          companyName: '',
          companyLogo: '',
          colors: [],
          watermark: false
        },
        content: {
          language: 'pt-BR',
          terminology: 'technical',
          complexity: 'intermediate',
          examples: 'industry-specific'
        }
      }
    };
  }

  private createNR33Template(): NRTemplate {
    return {
      id: 'nr-33-espacos-confinados',
      name: 'NR-33: Segurança e Saúde nos Trabalhos em Espaços Confinados',
      description: 'Template completo para treinamento sobre segurança em espaços confinados conforme NR-33',
      category: NRCategory.ESPACOS_CONFINADOS,
      norma: 'NR-33',
      version: '2023.1',
      duration: 3000, // 50 minutos
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      scenes: [
        {
          id: 'intro-nr33',
          name: 'Introdução aos Espaços Confinados',
          duration: 360,
          type: SceneType.INTRODUCAO,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'confined-space-training-facility',
                lighting: { type: 'artificial', intensity: 0.8 },
                camera: { position: [4, 2.5, 6], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'title-nr33',
                type: ElementType.TEXT,
                position: { x: 960, y: 120 },
                size: { width: 1600, height: 100 },
                content: {
                  text: 'NR-33: Espaços Confinados',
                  style: { fontSize: 44, fontWeight: 'bold', color: '#7c2d12' }
                },
                animation: {
                  type: 'fadeInDown',
                  duration: 2000,
                  delay: 300
                }
              },
              {
                id: 'confined-space-definition',
                type: ElementType.INFO_PANEL,
                position: { x: 960, y: 350 },
                size: { width: 1400, height: 300 },
                content: {
                  type: 'definition-panel',
                  title: 'O que é um Espaço Confinado?',
                  definition: 'Área fechada com meios limitados de entrada e saída, não projetada para ocupação humana contínua',
                  characteristics: [
                    'Ventilação natural deficiente',
                    'Pode conter atmosfera perigosa',
                    'Acesso restrito',
                    'Não destinado à ocupação contínua'
                  ]
                },
                animation: {
                  type: 'slideInUp',
                  duration: 2000,
                  delay: 1000
                }
              },
              {
                id: 'danger-statistics',
                type: ElementType.STATISTICS_PANEL,
                position: { x: 960, y: 700 },
                size: { width: 1400, height: 200 },
                content: {
                  type: 'safety-statistics',
                  stats: [
                    {
                      label: 'Acidentes Fatais',
                      value: '60%',
                      description: 'ocorrem em espaços confinados'
                    },
                    {
                      label: 'Tentativas de Resgate',
                      value: '50%',
                      description: 'resultam em mais vítimas'
                    },
                    {
                      label: 'Prevenção',
                      value: '95%',
                      description: 'dos acidentes são evitáveis'
                    }
                  ]
                },
                animation: {
                  type: 'slideInUp',
                  duration: 2000,
                  delay: 1500
                }
              }
            ],
            avatar: {
              avatarId: 'especialista-espacos-confinados',
              position: { x: -3, y: 0, z: 0 },
              animations: ['welcome-safety', 'point-to-confined-space'],
              expressions: ['serious', 'concerned'],
              clothing: 'confined-space-expert',
              props: ['gas-detector', 'safety-harness']
            },
            animations: [],
            effects: []
          },
          transitions: [
            {
              type: 'fade',
              duration: 1200,
              easing: 'ease-in-out'
            }
          ],
          voiceover: {
            text: 'Espaços confinados apresentam riscos únicos e potencialmente fatais. A NR-33 estabelece medidas rigorosas de segurança para proteger trabalhadores.',
            voiceId: 'pt-br-male-authoritative',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.9,
            emphasis: [
              { word: 'riscos únicos', type: 'strong' },
              { word: 'potencialmente fatais', type: 'strong' },
              { word: 'NR-33', type: 'strong' }
            ]
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 24,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Espaços confinados: riscos únicos e fatais' },
              { start: 4000, end: 8000, text: 'NR-33: medidas rigorosas de segurança' }
            ]
          }
        },
        {
          id: 'tipos-espacos-confinados',
          name: 'Tipos de Espaços Confinados',
          duration: 420,
          type: SceneType.TEORIA,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'industrial-complex',
                lighting: { type: 'artificial', intensity: 0.85 },
                camera: { position: [0, 3, 8], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'confined-spaces-grid',
                type: ElementType.INTERACTIVE_GRID,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 700 },
                content: {
                  type: 'confined-spaces-examples',
                  spaces: [
                    {
                      name: 'Tanques e Reservatórios',
                      image: 'tank-confined-space',
                      risks: ['Gases tóxicos', 'Deficiência de oxigênio', 'Afogamento'],
                      examples: ['Tanques de combustível', 'Silos', 'Reservatórios de água']
                    },
                    {
                      name: 'Tubulações e Dutos',
                      image: 'pipe-confined-space',
                      risks: ['Atmosfera tóxica', 'Espaço restrito', 'Temperatura'],
                      examples: ['Tubulações industriais', 'Dutos de ventilação', 'Galerias']
                    },
                    {
                      name: 'Poços e Escavações',
                      image: 'well-confined-space',
                      risks: ['Soterramento', 'Gases', 'Queda'],
                      examples: ['Poços de inspeção', 'Fossas', 'Escavações profundas']
                    },
                    {
                      name: 'Caldeiras e Fornos',
                      image: 'boiler-confined-space',
                      risks: ['Temperatura extrema', 'Gases de combustão', 'Estrutural'],
                      examples: ['Caldeiras industriais', 'Fornos', 'Câmaras de combustão']
                    }
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'instrutor-industrial',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['point-to-examples', 'explain-risks'],
              expressions: ['instructive', 'concerned'],
              clothing: 'industrial-safety-instructor',
              props: ['safety-checklist', 'gas-monitor']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Existem diversos tipos de espaços confinados, cada um com riscos específicos. Tanques, tubulações, poços e caldeiras são exemplos comuns.',
            voiceId: 'pt-br-male-professional',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: []
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Tipos: tanques, tubulações, poços, caldeiras' },
              { start: 4000, end: 8000, text: 'Cada tipo tem riscos específicos' }
            ]
          }
        },
        {
          id: 'riscos-atmosfericos',
          name: 'Riscos Atmosféricos',
          duration: 480,
          type: SceneType.RISCOS,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'atmospheric-testing-lab',
                lighting: { type: 'artificial', intensity: 0.85 },
                camera: { position: [0, 2, 6], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'atmospheric-risks-diagram',
                type: ElementType.INTERACTIVE_DIAGRAM,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 700 },
                content: {
                  type: 'atmospheric-hazards',
                  categories: {
                    deficiencia_oxigenio: {
                      name: 'Deficiência de Oxigênio',
                      description: 'Concentração abaixo de 20,9%',
                      effects: ['Tontura', 'Perda de consciência', 'Morte'],
                      limits: { safe: '>20.9%', dangerous: '<19.5%', fatal: '<16%' }
                    },
                    gases_toxicos: {
                      name: 'Gases Tóxicos',
                      description: 'Substâncias que causam intoxicação',
                      examples: ['Monóxido de carbono', 'Ácido sulfídrico', 'Amônia'],
                      effects: ['Irritação', 'Intoxicação', 'Morte']
                    },
                    gases_inflamaveis: {
                      name: 'Gases Inflamáveis',
                      description: 'Risco de explosão e incêndio',
                      examples: ['Metano', 'Propano', 'Vapores de solventes'],
                      limits: { safe: '<10% LIE', dangerous: '>10% LIE' }
                    }
                  }
                }
              }
            ],
            avatar: {
              avatarId: 'especialista-atmosferico',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['demonstrate-gas-detection', 'show-warning'],
              expressions: ['serious', 'alert'],
              clothing: 'atmospheric-specialist',
              props: ['multi-gas-detector', 'oxygen-meter']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Os riscos atmosféricos são os mais perigosos em espaços confinados. Deficiência de oxigênio, gases tóxicos e inflamáveis podem ser fatais.',
            voiceId: 'pt-br-male-professional',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: []
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Riscos atmosféricos são os mais perigosos' },
              { start: 4000, end: 8000, text: 'Oxigênio, gases tóxicos e inflamáveis' }
            ]
          }
        },
        {
          id: 'equipamentos-protecao',
          name: 'Equipamentos de Proteção e Monitoramento',
          duration: 420,
          type: SceneType.EQUIPAMENTOS,
          content: {
            background: {
              type: '3d-environment',
              value: {
                scene: 'safety-equipment-room',
                lighting: { type: 'artificial', intensity: 0.85 },
                camera: { position: [0, 2, 8], target: [0, 1.5, 0] }
              }
            },
            elements: [
              {
                id: 'safety-equipment-showcase',
                type: ElementType.EQUIPMENT_SHOWCASE,
                position: { x: 960, y: 500 },
                size: { width: 1600, height: 700 },
                content: {
                  type: 'confined-space-equipment',
                  categories: [
                    {
                      name: 'Monitoramento Atmosférico',
                      equipment: [
                        {
                          name: 'Detector Multi-gás',
                          function: 'Monitora O2, gases tóxicos e inflamáveis',
                          mandatory: true
                        },
                        {
                          name: 'Detector de Oxigênio',
                          function: 'Mede concentração de O2',
                          mandatory: true
                        }
                      ]
                    },
                    {
                      name: 'Proteção Respiratória',
                      equipment: [
                        {
                          name: 'Respirador Autônomo',
                          function: 'Fornece ar limpo independente',
                          mandatory: true
                        },
                        {
                          name: 'Máscara com Linha de Ar',
                          function: 'Ar fornecido por compressor externo',
                          mandatory: false
                        }
                      ]
                    },
                    {
                      name: 'Proteção contra Quedas',
                      equipment: [
                        {
                          name: 'Cinturão de Segurança',
                          function: 'Proteção contra quedas',
                          mandatory: true
                        },
                        {
                          name: 'Tripé de Resgate',
                          function: 'Sistema de içamento e resgate',
                          mandatory: true
                        }
                      ]
                    }
                  ]
                }
              }
            ],
            avatar: {
              avatarId: 'especialista-equipamentos',
              position: { x: -2.5, y: 0, z: 0 },
              animations: ['demonstrate-equipment', 'show-proper-use'],
              expressions: ['professional', 'instructive'],
              clothing: 'safety-equipment-specialist',
              props: ['various-safety-equipment']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Equipamentos adequados são essenciais para trabalho seguro em espaços confinados. Monitoramento atmosférico e proteção respiratória são obrigatórios.',
            voiceId: 'pt-br-male-professional',
            speed: 0.85,
            pitch: 1.0,
            volume: 0.85,
            emphasis: []
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Equipamentos adequados são essenciais' },
              { start: 4000, end: 8000, text: 'Monitoramento e proteção obrigatórios' }
            ]
          }
        },
        {
          id: 'quiz-nr33',
          name: 'Avaliação de Conhecimentos',
          duration: 420,
          type: SceneType.QUIZ,
          content: {
            background: {
              type: 'gradient',
              value: {
                colors: ['#7c2d12', '#a16207'],
                direction: 135,
                type: 'linear'
              }
            },
            elements: [
              {
                id: 'quiz-question',
                type: ElementType.TEXT,
                position: { x: 960, y: 200 },
                size: { width: 1400, height: 120 },
                content: {
                  text: 'Qual é o limite mínimo seguro de oxigênio em espaços confinados?',
                  style: { fontSize: 26, color: '#ffffff', textAlign: 'center' }
                }
              },
              {
                id: 'quiz-options',
                type: ElementType.FORM,
                position: { x: 960, y: 500 },
                size: { width: 1000, height: 350 },
                content: {
                  type: 'multiple-choice',
                  options: [
                    'A) 18%',
                    'B) 19,5%',
                    'C) 20,9%',
                    'D) 21%'
                  ],
                  correct: 2
                }
              }
            ],
            avatar: {
              avatarId: 'instrutor-avaliacao',
              position: { x: 0, y: 0, z: 0 },
              animations: ['questioning-pose'],
              expressions: ['questioning'],
              clothing: 'confined-space-instructor',
              props: ['oxygen-meter']
            },
            animations: [],
            effects: []
          },
          transitions: [],
          voiceover: {
            text: 'Qual é o limite mínimo seguro de concentração de oxigênio para trabalho em espaços confinados?',
            voiceId: 'pt-br-male-professional',
            speed: 0.9,
            pitch: 1.0,
            volume: 0.85,
            emphasis: []
          },
          subtitles: {
            enabled: true,
            language: 'pt-BR',
            style: {
              fontSize: 22,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              position: 'bottom'
            },
            timing: [
              { start: 0, end: 4000, text: 'Limite mínimo seguro de oxigênio?' }
            ]
          },
          interactivity: {
            type: 'quiz',
            triggers: [
              {
                time: 0,
                question: 'Qual é o limite mínimo seguro de concentração de oxigênio?',
                options: ['18%', '19,5%', '20,9%', '21%'],
                correct: 2,
                explanation: 'Correto! 20,9% é a concentração normal de oxigênio.'
              }
            ],
            feedback: {
              correct: 'Correto! 20,9% é a concentração normal de oxigênio.',
              incorrect: 'Incorreto. Abaixo de 20,9% é considerado deficiente.'
            }
          }
        }
      ],
      assets: [
        {
          id: 'confined-space-diagram',
          type: AssetType.IMAGE,
          name: 'Diagrama de Espaço Confinado',
          url: '/assets/icons/confined-space.svg',
          metadata: {
            format: 'svg',
            size: 76800,
            tags: ['educational', 'diagram']
          },
          compliance: true
        },
        {
          id: 'gas-detector-model',
          type: AssetType.MODEL_3D,
          name: 'Modelo 3D Detector de Gases',
          url: '/assets/models/gas-detector.glb',
          metadata: {
            format: 'glb',
            size: 2500000,
            tags: ['equipment', 'demonstration']
          },
          compliance: true
        }
      ],
      compliance: {
        normaNumber: 'NR-33',
        lastUpdate: '2023-01-01',
        requirements: [
          'Permissão de Entrada e Trabalho (PET)',
          'Monitoramento atmosférico contínuo',
          'Ventilação forçada quando necessário',
          'Equipamentos de proteção individual',
          'Sistema de comunicação',
          'Equipe de resgate treinada',
          'Vigia permanente do lado externo'
        ],
        certifications: ['Certificado NR-33', 'Supervisor de Entrada', 'Trabalhador Autorizado'],
        validationRules: [
          {
            rule: 'atmospheric-monitoring',
            description: 'Verificar conhecimento sobre monitoramento atmosférico',
            required: true
          },
          {
            rule: 'emergency-procedures',
            description: 'Verificar conhecimento sobre procedimentos de emergência',
            required: true
          },
          {
            rule: 'equipment-usage',
            description: 'Verificar conhecimento sobre uso correto de equipamentos',
            required: true
          }
        ]
      },
      customization: {
        colors: {
          primary: '#7c2d12',
          secondary: '#a16207',
          accent: '#d97706',
          background: '#fef7ed',
          text: '#1f2937'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Roboto',
          sizes: { small: 14, medium: 18, large: 24, xlarge: 32 }
        },
        logos: [],
        branding: {
          companyName: '',
          companyLogo: '',
          colors: [],
          watermark: false
        },
        content: {
          language: 'pt-BR',
          terminology: 'technical',
          complexity: 'advanced',
          examples: 'industry-specific'
        }
      }
    };
  }

  // Métodos de carregamento de assets
  private loadSafetyEquipmentAssets(): void {
    // Carregar modelos 3D de equipamentos de segurança
  }

  private loadEnvironmentAssets(): void {
    // Carregar ambientes 3D (canteiros, fábricas, etc.)
  }

  private loadProcedureAssets(): void {
    // Carregar assets de procedimentos
  }

  private loadEmergencyAssets(): void {
    // Carregar assets de emergência
  }

  // Métodos auxiliares
  private addTemplate(template: NRTemplate): void {
    this.templates.set(template.id, template);
    
    if (!this.categories.has(template.category)) {
      this.categories.set(template.category, []);
    }
    this.categories.get(template.category)!.push(template);
  }

  private convertTemplateToProject(template: NRTemplate, customization: TemplateCustomization): VideoProject {
    // Converter template em projeto de vídeo
    const project: VideoProject = {
      id: `project-${Date.now()}`,
      name: template.name,
      description: template.description,
      duration: template.duration,
      frameRate: 30,
      fps: 30,
      resolution: template.resolution,
      aspectRatio: template.aspectRatio,
      layers: [],
      assets: [],
      timeline: {
        currentTime: 0,
        duration: template.duration,
        tracks: []
      },
      settings: {
        backgroundColor: customization.colors.background,
        audioSettings: {
          sampleRate: 48000,
          bitRate: 320,
          channels: 2
        }
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        tags: [template.norma, template.category],
        compliance: template.compliance
      }
    };

    // Converter cenas em layers
    template.scenes.forEach((scene, index) => {
      const sceneLayer: VideoLayer = {
        id: scene.id,
        name: scene.name,
        type: 'scene',
        startTime: index * scene.duration,
        duration: scene.duration,
        properties: {
          content: scene.content,
          voiceover: scene.voiceover,
          subtitles: scene.subtitles,
          interactivity: scene.interactivity
        },
        effects: scene.content.effects,
        visible: true,
        locked: false,
        opacity: 1
      };
      
      project.layers.push(sceneLayer);
    });

    return project;
  }

  private performComplianceValidation(template: NRTemplate): ComplianceValidationResult {
    const results: ValidationResult[] = [];
    
    template.compliance.validationRules.forEach(rule => {
      const result = this.validateRule(template, rule);
      results.push(result);
    });

    return {
      templateId: template.id,
      norma: template.norma,
      isCompliant: results.every(r => r.passed),
      results,
      recommendations: this.generateRecommendations(results)
    };
  }

  private validateRule(template: NRTemplate, rule: ValidationRule): ValidationResult {
    // Implementar validação específica de cada regra
    return {
      ruleId: rule.rule,
      description: rule.description,
      passed: true,
      message: 'Validação passou',
      severity: 'info'
    };
  }

  private generateRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    results.forEach(result => {
      if (!result.passed) {
        recommendations.push(`Corrigir: ${result.description}`);
      }
    });
    
    return recommendations;
  }
}

// Interfaces auxiliares
export interface ValidationRule {
  rule: string;
  description: string;
  required: boolean;
}

export interface ComplianceValidationResult {
  templateId: string;
  norma: string;
  isCompliant: boolean;
  results: ValidationResult[];
  recommendations: string[];
}

export interface ValidationResult {
  ruleId: string;
  description: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface FontScheme {
  primary: string;
  secondary: string;
  sizes: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
}

export interface LogoConfig {
  id: string;
  url: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size: { width: number; height: number };
}

export interface BrandingConfig {
  companyName: string;
  companyLogo: string;
  colors: string[];
  watermark: boolean;
}

export interface ContentCustomization {
  language: string;
  terminology: 'simple' | 'technical' | 'advanced';
  complexity: 'basic' | 'intermediate' | 'advanced';
  examples: 'generic' | 'industry-specific' | 'company-specific';
}

export interface SceneTransition {
  type: 'fade' | 'slide' | 'zoom' | 'wipe';
  duration: number;
  easing: string;
}

export interface ElementAnimation {
  type: string;
  duration: number;
  delay?: number;
  easing?: string;
}

export interface ElementInteractivity {
  type: 'click' | 'hover';
  action: string;
  target?: string;
}

export interface AnimationConfig {
  id: string;
  name: string;
  type: string;
  duration: number;
  properties: any;
}

export interface LightingConfig {
  type: 'natural' | 'artificial' | 'mixed';
  intensity: number;
  color?: string;
  shadows?: boolean;
}

export interface CameraConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
}

export interface EmphasisPoint {
  word: string;
  type: 'strong' | 'emphasis' | 'pause';
  duration?: number;
}

export interface SubtitleStyle {
  fontSize: number;
  color: string;
  backgroundColor: string;
  position: 'top' | 'bottom' | 'center';
}

export interface SubtitleTiming {
  start: number;
  end: number;
  text: string;
}

export interface InteractionTrigger {
  time: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface FeedbackConfig {
  correct: string;
  incorrect: string;
}

export interface AssetMetadata {
  size: number;
  format: string;
  resolution?: { width: number; height: number };
  duration?: number;
  tags: string[];
}

export default NRTemplateSystem;