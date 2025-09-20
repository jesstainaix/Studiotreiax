const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class TemplatesService {
  constructor() {
    this.templates = new Map();
    this.categories = new Map();
    this.collections = new Map();
    this.reviews = new Map();
    this.learningPaths = new Map();
    this.assets3D = new Map();
    this.analytics = new Map();
    this.initializeService();
  }

  async initializeService() {
    this.initializeMockData();
    this.setupAnalyticsTracking();
  }

  initializeMockData() {
    // Initialize NR categories
    this.categories.set('NR-35', {
      id: 'NR-35',
      name: 'Trabalho em Altura',
      description: 'Norma Regulamentadora sobre trabalho em altura',
      icon: 'height-icon',
      color: '#FF6B35',
      templateCount: 15,
      subcategories: [
        'Equipamentos de Proteção',
        'Procedimentos de Segurança',
        'Resgate e Emergência',
        'Inspeção e Manutenção'
      ],
      compliance: {
        required: true,
        certificationNeeded: true,
        validityPeriod: 365, // days
        renewalRequired: true
      }
    });

    this.categories.set('NR-33', {
      id: 'NR-33',
      name: 'Espaços Confinados',
      description: 'Norma Regulamentadora sobre segurança em espaços confinados',
      icon: 'confined-space-icon',
      color: '#4ECDC4',
      templateCount: 12,
      subcategories: [
        'Identificação de Riscos',
        'Procedimentos de Entrada',
        'Monitoramento Atmosférico',
        'Equipamentos de Proteção'
      ],
      compliance: {
        required: true,
        certificationNeeded: true,
        validityPeriod: 365,
        renewalRequired: true
      }
    });

    this.categories.set('NR-10', {
      id: 'NR-10',
      name: 'Segurança em Instalações Elétricas',
      description: 'Norma sobre segurança em instalações e serviços em eletricidade',
      icon: 'electrical-icon',
      color: '#FFE66D',
      templateCount: 18,
      subcategories: [
        'Riscos Elétricos',
        'Medidas de Proteção',
        'Procedimentos de Trabalho',
        'Primeiros Socorros'
      ],
      compliance: {
        required: true,
        certificationNeeded: true,
        validityPeriod: 730, // 2 years
        renewalRequired: true
      }
    });

    // Initialize templates organized by NR
    this.templates.set('template_nr35_001', {
      id: 'template_nr35_001',
      title: 'Introdução ao Trabalho em Altura - NR-35',
      description: 'Template básico para treinamento introdutório sobre trabalho em altura conforme NR-35',
      category: 'NR-35',
      subcategory: 'Equipamentos de Proteção',
      type: 'interactive_3d',
      difficulty: 'beginner',
      duration: 3600, // 1 hour
      language: 'pt',
      industry: ['construção', 'industrial', 'manutenção'],
      tags: ['segurança', 'altura', 'epi', 'nr35', 'básico'],
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20training%20height%20work%20construction%20helmet%20harness&image_size=landscape_16_9',
      preview: {
        images: [
          'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=3d%20construction%20site%20safety%20training%20scene&image_size=landscape_4_3',
          'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20equipment%20harness%20helmet%20interactive%203d&image_size=square',
          'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=height%20work%20platform%20safety%20procedures&image_size=portrait_4_3'
        ],
        video: '/api/templates/template_nr35_001/preview.mp4',
        demo: '/api/templates/template_nr35_001/demo'
      },
      content: {
        scenes: [
          {
            id: 'intro_scene',
            title: 'Introdução à NR-35',
            type: '3d_environment',
            duration: 300,
            environment: {
              name: 'construction_site',
              lighting: 'daylight',
              weather: 'clear',
              sounds: ['construction_ambient', 'wind_light']
            },
            avatars: [
              {
                id: 'instructor',
                name: 'Instrutor de Segurança',
                model: 'safety_instructor_male',
                position: { x: 0, y: 0, z: 0 },
                animations: ['greeting', 'explaining', 'pointing']
              }
            ],
            objects: [
              {
                id: 'safety_signs',
                name: 'Placas de Sinalização',
                model: 'safety_signs_set',
                position: { x: 5, y: 0, z: 2 },
                interactive: true,
                actions: ['click_info', 'highlight']
              },
              {
                id: 'construction_equipment',
                name: 'Equipamentos de Construção',
                model: 'construction_tools',
                position: { x: -3, y: 0, z: 4 },
                interactive: false
              }
            ],
            script: {
              narrator: 'Bem-vindos ao treinamento sobre trabalho em altura conforme a NR-35. Esta norma estabelece os requisitos mínimos e as medidas de proteção para o trabalho em altura.',
              subtitles: true,
              audioFile: '/assets/audio/nr35_intro.mp3'
            },
            interactions: [
              {
                id: 'signs_interaction',
                type: 'click',
                target: 'safety_signs',
                trigger: 'user_click',
                action: {
                  type: 'show_info_panel',
                  content: {
                    title: 'Sinalização de Segurança',
                    text: 'As placas de sinalização são fundamentais para identificar áreas de risco e orientar sobre procedimentos de segurança.',
                    image: '/assets/images/safety_signs_detail.jpg'
                  }
                }
              }
            ],
            assessment: {
              type: 'knowledge_check',
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'A partir de qual altura se aplica a NR-35?',
                  options: ['1,5 metros', '2,0 metros', '2,5 metros', '3,0 metros'],
                  correct: 1,
                  explanation: 'A NR-35 se aplica a trabalhos realizados acima de 2,0 metros de altura.'
                }
              ]
            }
          },
          {
            id: 'equipment_scene',
            title: 'Equipamentos de Proteção Individual',
            type: '3d_interactive',
            duration: 900,
            environment: {
              name: 'equipment_room',
              lighting: 'indoor_bright',
              sounds: ['indoor_ambient']
            },
            avatars: [
              {
                id: 'instructor',
                name: 'Instrutor de Segurança',
                model: 'safety_instructor_female',
                position: { x: 0, y: 0, z: 0 },
                animations: ['demonstrating', 'explaining', 'checking_equipment']
              }
            ],
            objects: [
              {
                id: 'safety_harness',
                name: 'Cinturão de Segurança',
                model: 'safety_harness_detailed',
                position: { x: 2, y: 1, z: 0 },
                interactive: true,
                actions: ['inspect', 'rotate', 'zoom', 'disassemble']
              },
              {
                id: 'helmet',
                name: 'Capacete de Segurança',
                model: 'safety_helmet',
                position: { x: -2, y: 1, z: 0 },
                interactive: true,
                actions: ['inspect', 'rotate', 'check_certification']
              },
              {
                id: 'rope_system',
                name: 'Sistema de Cordas',
                model: 'rope_safety_system',
                position: { x: 0, y: 1, z: 3 },
                interactive: true,
                actions: ['inspect', 'test_strength', 'check_wear']
              }
            ],
            script: {
              narrator: 'Agora vamos conhecer os equipamentos de proteção individual essenciais para trabalho em altura. Cada equipamento tem características específicas e deve ser inspecionado antes do uso.',
              subtitles: true,
              audioFile: '/assets/audio/nr35_equipment.mp3'
            },
            interactions: [
              {
                id: 'harness_inspection',
                type: 'drag_drop',
                target: 'safety_harness',
                trigger: 'user_drag',
                action: {
                  type: 'inspection_sequence',
                  steps: [
                    'Verificar fivelas e costuras',
                    'Checar pontos de ancoragem',
                    'Testar ajustes',
                    'Validar certificação'
                  ],
                  feedback: 'Excelente! Você completou a inspeção corretamente.'
                }
              },
              {
                id: 'helmet_check',
                type: 'click_sequence',
                target: 'helmet',
                trigger: 'user_click',
                action: {
                  type: 'detailed_inspection',
                  checkpoints: [
                    { point: 'shell', status: 'good', note: 'Sem rachaduras' },
                    { point: 'suspension', status: 'good', note: 'Ajuste adequado' },
                    { point: 'certification', status: 'valid', note: 'CA válido' }
                  ]
                }
              }
            ],
            simulation: {
              id: 'equipment_assembly',
              name: 'Montagem Correta dos EPIs',
              type: 'step_by_step',
              steps: [
                {
                  id: 'step1',
                  title: 'Colocar o Cinturão',
                  instruction: 'Posicione o cinturão corretamente no corpo',
                  validation: 'check_harness_position',
                  feedback: 'Cinturão posicionado corretamente!'
                },
                {
                  id: 'step2',
                  title: 'Ajustar Fivelas',
                  instruction: 'Ajuste todas as fivelas adequadamente',
                  validation: 'check_buckles',
                  feedback: 'Fivelas ajustadas com segurança!'
                },
                {
                  id: 'step3',
                  title: 'Conectar Talabarte',
                  instruction: 'Conecte o talabarte ao ponto de ancoragem',
                  validation: 'check_lanyard_connection',
                  feedback: 'Conexão realizada com sucesso!'
                }
              ]
            }
          },
          {
            id: 'procedures_scene',
            title: 'Procedimentos de Segurança',
            type: '3d_simulation',
            duration: 1200,
            environment: {
              name: 'industrial_platform',
              lighting: 'industrial',
              weather: 'windy',
              sounds: ['industrial_ambient', 'wind_strong', 'machinery']
            },
            avatars: [
              {
                id: 'worker',
                name: 'Trabalhador',
                model: 'construction_worker',
                position: { x: -2, y: 0, z: 0 },
                animations: ['working', 'checking', 'moving_carefully']
              },
              {
                id: 'supervisor',
                name: 'Supervisor',
                model: 'safety_supervisor',
                position: { x: 2, y: 0, z: 0 },
                animations: ['observing', 'instructing', 'checking_safety']
              }
            ],
            objects: [
              {
                id: 'platform',
                name: 'Plataforma de Trabalho',
                model: 'industrial_platform',
                position: { x: 0, y: 5, z: 0 },
                interactive: true,
                actions: ['access', 'work_on', 'secure']
              },
              {
                id: 'anchor_points',
                name: 'Pontos de Ancoragem',
                model: 'anchor_points_set',
                position: { x: 0, y: 6, z: 0 },
                interactive: true,
                actions: ['test_strength', 'connect', 'inspect']
              },
              {
                id: 'safety_net',
                name: 'Rede de Segurança',
                model: 'safety_net',
                position: { x: 0, y: 2, z: 0 },
                interactive: false
              }
            ],
            script: {
              narrator: 'Vamos praticar os procedimentos corretos de segurança em trabalho em altura. Observe atentamente cada etapa e participe das simulações.',
              subtitles: true,
              audioFile: '/assets/audio/nr35_procedures.mp3'
            },
            simulations: [
              {
                id: 'platform_access',
                name: 'Acesso Seguro à Plataforma',
                type: 'guided_practice',
                scenario: 'O trabalhador precisa acessar a plataforma de trabalho seguindo todos os procedimentos de segurança.',
                steps: [
                  {
                    id: 'pre_check',
                    title: 'Verificação Prévia',
                    actions: ['check_equipment', 'verify_weather', 'confirm_authorization'],
                    validation: 'all_checks_passed',
                    timeLimit: 120
                  },
                  {
                    id: 'approach',
                    title: 'Aproximação',
                    actions: ['identify_hazards', 'plan_route', 'communicate_team'],
                    validation: 'safe_approach',
                    timeLimit: 90
                  },
                  {
                    id: 'access',
                    title: 'Acesso',
                    actions: ['connect_lanyard', 'test_connection', 'climb_safely'],
                    validation: 'successful_access',
                    timeLimit: 180
                  }
                ],
                scoring: {
                  perfect: 100,
                  good: 80,
                  acceptable: 60,
                  needsImprovement: 40
                }
              },
              {
                id: 'emergency_response',
                name: 'Resposta a Emergência',
                type: 'scenario_based',
                scenario: 'Um trabalhador sofreu uma queda e está suspenso pelo cinturão. Execute os procedimentos de resgate.',
                steps: [
                  {
                    id: 'assess',
                    title: 'Avaliação da Situação',
                    actions: ['check_victim_consciousness', 'assess_injuries', 'call_emergency'],
                    validation: 'proper_assessment',
                    timeLimit: 60
                  },
                  {
                    id: 'rescue',
                    title: 'Procedimento de Resgate',
                    actions: ['secure_area', 'prepare_rescue_equipment', 'execute_rescue'],
                    validation: 'successful_rescue',
                    timeLimit: 300
                  }
                ]
              }
            ]
          },
          {
            id: 'assessment_scene',
            title: 'Avaliação Final',
            type: 'comprehensive_quiz',
            duration: 900,
            environment: {
              name: 'classroom',
              lighting: 'classroom',
              sounds: ['classroom_ambient']
            },
            quiz: {
              id: 'nr35_final_assessment',
              title: 'Avaliação Final - NR-35',
              description: 'Teste seus conhecimentos sobre trabalho em altura',
              timeLimit: 900, // 15 minutes
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'Qual é a altura mínima para aplicação da NR-35?',
                  options: ['1,5 metros', '2,0 metros', '2,5 metros', '3,0 metros'],
                  correct: 1,
                  points: 10,
                  explanation: 'A NR-35 se aplica a trabalhos realizados acima de 2,0 metros de altura do nível inferior.'
                },
                {
                  id: 'q2',
                  type: 'true_false',
                  question: 'É permitido trabalhar em altura durante tempestades com raios.',
                  correct: false,
                  points: 10,
                  explanation: 'Trabalhos em altura devem ser suspensos durante condições climáticas adversas, especialmente tempestades.'
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Qual equipamento é obrigatório para trabalho em altura?',
                  options: ['Capacete', 'Cinturão de segurança', 'Luvas', 'Todos os anteriores'],
                  correct: 3,
                  points: 15,
                  explanation: 'Todos os equipamentos mencionados são obrigatórios para trabalho em altura conforme a NR-35.'
                },
                {
                  id: 'q4',
                  type: 'scenario',
                  question: 'Você está trabalhando em uma plataforma a 8 metros de altura e percebe que seu cinturão está com uma fivela danificada. Qual a ação correta?',
                  options: [
                    'Continuar trabalhando com cuidado',
                    'Parar imediatamente e descer da plataforma',
                    'Tentar consertar a fivela',
                    'Avisar o supervisor mas continuar trabalhando'
                  ],
                  correct: 1,
                  points: 20,
                  explanation: 'Equipamentos danificados representam risco grave. O trabalho deve ser interrompido imediatamente.'
                },
                {
                  id: 'q5',
                  type: 'drag_drop',
                  question: 'Ordene os passos corretos para acesso seguro a uma plataforma elevada:',
                  items: [
                    'Verificar equipamentos',
                    'Conectar talabarte',
                    'Testar ponto de ancoragem',
                    'Subir na plataforma',
                    'Comunicar à equipe'
                  ],
                  correctOrder: [0, 4, 2, 1, 3],
                  points: 25,
                  explanation: 'A sequência correta garante máxima segurança durante o acesso.'
                }
              ],
              feedback: {
                excellent: 'Excelente! Você demonstrou domínio completo dos conceitos de segurança em altura.',
                good: 'Bom trabalho! Você tem um bom entendimento dos procedimentos de segurança.',
                needsImprovement: 'É recomendado revisar o conteúdo antes de trabalhar em altura.'
              }
            }
          },
          {
            id: 'certificate_scene',
            title: 'Certificação',
            type: 'certificate_generation',
            duration: 180,
            certificate: {
              template: 'nr35_certificate',
              title: 'Certificado de Conclusão - NR-35',
              subtitle: 'Trabalho em Altura',
              requirements: {
                minScore: 70,
                completedScenes: ['intro_scene', 'equipment_scene', 'procedures_scene', 'assessment_scene'],
                timeSpent: 3000 // minimum 50 minutes
              },
              validity: {
                period: 365, // days
                renewalRequired: true
              },
              verification: {
                qrCode: true,
                digitalSignature: true,
                blockchainHash: true
              }
            }
          }
        ],
        totalDuration: 3600,
        hasQuiz: true,
        hasCertificate: true,
        hasSimulation: true,
        has3DContent: true,
        hasVR: true,
        hasAR: false,
        accessibility: {
          subtitles: true,
          audioDescription: true,
          signLanguage: false,
          highContrast: true,
          screenReader: true
        }
      },
      assets3D: [
        {
          id: 'construction_site',
          name: 'Canteiro de Obras',
          type: 'environment',
          format: 'gltf',
          size: 15000000, // bytes
          url: '/assets/3d/environments/construction_site.gltf',
          preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=3d%20construction%20site%20environment&image_size=landscape_4_3',
          polyCount: 50000,
          textureResolution: '2048x2048',
          animations: ['day_night_cycle', 'weather_changes'],
          interactive: true
        },
        {
          id: 'safety_harness_detailed',
          name: 'Cinturão de Segurança Detalhado',
          type: 'object',
          format: 'gltf',
          size: 2500000,
          url: '/assets/3d/objects/safety_harness_detailed.gltf',
          preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=detailed%203d%20safety%20harness%20equipment&image_size=square',
          polyCount: 8000,
          textureResolution: '1024x1024',
          animations: ['wear_sequence', 'inspection_highlights'],
          interactive: true,
          physics: true
        }
      ],
      customization: {
        allowContentEdit: true,
        allowSceneReorder: true,
        allowDurationChange: true,
        allowLanguageChange: true,
        allowBrandingCustomization: true,
        customFields: [
          {
            id: 'company_name',
            name: 'Nome da Empresa',
            type: 'text',
            required: false,
            placeholder: 'Digite o nome da sua empresa'
          },
          {
            id: 'instructor_name',
            name: 'Nome do Instrutor',
            type: 'text',
            required: false,
            placeholder: 'Nome do instrutor responsável'
          },
          {
            id: 'specific_procedures',
            name: 'Procedimentos Específicos',
            type: 'textarea',
            required: false,
            placeholder: 'Procedimentos específicos da empresa'
          }
        ]
      },
      analytics: {
        usage: {
          totalDownloads: 1250,
          activeProjects: 89,
          completionRate: 87.3,
          averageScore: 84.2,
          userSatisfaction: 4.6
        },
        performance: {
          loadTime: 3.2, // seconds
          renderPerformance: 'excellent',
          memoryUsage: 'moderate',
          compatibility: 95.8 // percentage
        },
        feedback: {
          totalReviews: 156,
          averageRating: 4.6,
          wouldRecommend: 92.3,
          reportedIssues: 3
        }
      },
      compliance: {
        approved: true,
        approvedBy: 'compliance_team',
        approvedAt: new Date('2024-01-10'),
        certificationValid: true,
        expiresAt: new Date('2025-01-10'),
        complianceChecks: [
          {
            type: 'content_accuracy',
            status: 'passed',
            checkedAt: new Date('2024-01-08'),
            checkedBy: 'safety_expert_1',
            notes: 'Conteúdo alinhado com NR-35 atualizada'
          },
          {
            type: 'technical_quality',
            status: 'passed',
            checkedAt: new Date('2024-01-09'),
            checkedBy: 'tech_reviewer_1',
            notes: 'Qualidade técnica excelente'
          }
        ],
        legalRequirements: [
          'NR-35 - Trabalho em Altura',
          'Portaria SEPRT n.º 915/2019',
          'ABNT NBR 15835'
        ]
      },
      marketplace: {
        price: 299.99,
        currency: 'BRL',
        license: 'commercial',
        seller: {
          id: 'studio_treiax',
          name: 'Studio TreiaX',
          rating: 4.8,
          verified: true
        },
        sales: {
          total: 1250,
          thisMonth: 89,
          revenue: 374987.50
        },
        promotion: {
          active: false,
          discount: 0,
          validUntil: null
        }
      },
      metadata: {
        version: '2.1.0',
        lastUpdated: new Date('2024-01-15'),
        fileSize: 125000000,
        checksum: 'sha256:def789abc456',
        dependencies: [
          'three.js@0.150.0',
          'babylon.js@5.0.0',
          'audio-engine@2.1.0'
        ],
        compatibility: {
          browsers: ['Chrome 90+', 'Firefox 88+', 'Safari 14+', 'Edge 90+'],
          devices: ['Desktop', 'Tablet', 'Mobile', 'VR Headsets'],
          platforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android']
        }
      },
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-01-15')
    });

    // Add more templates for different NRs
    this.templates.set('template_nr33_001', {
      id: 'template_nr33_001',
      title: 'Segurança em Espaços Confinados - NR-33',
      description: 'Template completo para treinamento sobre segurança em espaços confinados',
      category: 'NR-33',
      subcategory: 'Identificação de Riscos',
      type: 'immersive_simulation',
      difficulty: 'intermediate',
      duration: 4200, // 70 minutes
      language: 'pt',
      industry: ['petroquímica', 'siderurgia', 'naval', 'construção'],
      tags: ['espaços confinados', 'atmosfera', 'gases', 'nr33', 'resgate'],
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=confined%20space%20safety%20training%20industrial%20tank&image_size=landscape_16_9',
      // ... similar structure with NR-33 specific content
      analytics: {
        usage: {
          totalDownloads: 890,
          activeProjects: 67,
          completionRate: 91.2,
          averageScore: 86.7,
          userSatisfaction: 4.7
        }
      },
      createdAt: new Date('2023-11-15'),
      updatedAt: new Date('2024-01-12')
    });

    // Initialize collections
    this.collections.set('collection_safety_basics', {
      id: 'collection_safety_basics',
      name: 'Fundamentos de Segurança',
      description: 'Coleção essencial de templates para treinamentos básicos de segurança',
      category: 'safety',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20training%20collection%20industrial%20workplace&image_size=landscape_16_9',
      templates: ['template_nr35_001', 'template_nr33_001'],
      tags: ['segurança', 'básico', 'nr', 'compliance'],
      difficulty: 'beginner',
      totalDuration: 7800, // sum of all templates
      price: 499.99,
      discount: 15, // percentage
      featured: true,
      createdBy: 'studio_treiax',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    });

    // Initialize learning paths
    this.learningPaths.set('path_safety_specialist', {
      id: 'path_safety_specialist',
      name: 'Especialista em Segurança do Trabalho',
      description: 'Caminho completo para formação de especialistas em segurança',
      category: 'professional_development',
      level: 'advanced',
      estimatedDuration: 40, // hours
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20specialist%20professional%20training%20path&image_size=landscape_16_9',
      modules: [
        {
          id: 'module_1',
          name: 'Fundamentos de Segurança',
          templates: ['template_nr35_001'],
          duration: 8, // hours
          required: true,
          prerequisites: []
        },
        {
          id: 'module_2',
          name: 'Espaços Confinados',
          templates: ['template_nr33_001'],
          duration: 12,
          required: true,
          prerequisites: ['module_1']
        },
        {
          id: 'module_3',
          name: 'Segurança Elétrica',
          templates: ['template_nr10_001'],
          duration: 16,
          required: true,
          prerequisites: ['module_1', 'module_2']
        }
      ],
      certification: {
        available: true,
        name: 'Certificado de Especialista em Segurança',
        validityPeriod: 730, // 2 years
        requirements: {
          completionRate: 90,
          minimumScore: 80,
          practicalAssessment: true
        }
      },
      analytics: {
        enrollments: 234,
        completions: 189,
        averageTime: 38.5, // hours
        satisfaction: 4.8
      },
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2024-01-10')
    });

    // Initialize reviews
    this.reviews.set('review_1', {
      id: 'review_1',
      templateId: 'template_nr35_001',
      userId: 'user123',
      userName: 'João Silva',
      userRole: 'Técnico de Segurança',
      rating: 5,
      title: 'Excelente template para treinamento',
      comment: 'Template muito bem estruturado, com conteúdo atualizado e simulações realistas. Recomendo para todas as empresas que trabalham com altura.',
      helpful: 23,
      verified: true, // verified purchase
      createdAt: new Date('2024-01-10'),
      response: {
        author: 'Studio TreiaX',
        message: 'Obrigado pelo feedback! Ficamos felizes que o template atendeu suas expectativas.',
        createdAt: new Date('2024-01-11')
      }
    });

    // Initialize 3D assets
    this.assets3D.set('asset_construction_site', {
      id: 'asset_construction_site',
      name: 'Canteiro de Obras Completo',
      description: 'Ambiente 3D detalhado de canteiro de obras para treinamentos de segurança',
      category: 'environment',
      tags: ['construção', 'canteiro', 'industrial', 'realista'],
      format: 'gltf',
      fileSize: 25000000, // 25MB
      polyCount: 75000,
      textureResolution: '4096x4096',
      animations: ['day_night_cycle', 'weather_effects', 'machinery_operation'],
      interactive: true,
      physics: true,
      vrCompatible: true,
      arCompatible: false,
      preview: {
        images: [
          'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=3d%20construction%20site%20overview%20realistic&image_size=landscape_16_9',
          'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=construction%20equipment%203d%20detailed&image_size=square'
        ],
        video: '/assets/3d/previews/construction_site_preview.mp4'
      },
      downloadUrl: '/assets/3d/environments/construction_site_complete.gltf',
      license: 'commercial',
      price: 149.99,
      downloads: 456,
      rating: 4.7,
      compatibility: {
        engines: ['Three.js', 'Babylon.js', 'Unity', 'Unreal Engine'],
        platforms: ['Web', 'Desktop', 'Mobile', 'VR']
      },
      createdAt: new Date('2023-11-20'),
      updatedAt: new Date('2024-01-05')
    });
  }

  setupAnalyticsTracking() {
    // Setup real-time analytics tracking for templates
    this.analyticsInterval = setInterval(() => {
      this.updateTemplateAnalytics();
    }, 60000); // Update every minute
  }

  updateTemplateAnalytics() {
    // Simulate real-time analytics updates for templates
    for (const [templateId, template] of this.templates.entries()) {
      if (template.analytics && template.analytics.usage) {
        // Simulate new downloads and usage
        const randomDownloads = Math.floor(Math.random() * 3);
        const randomProjects = Math.floor(Math.random() * 2);
        
        template.analytics.usage.totalDownloads += randomDownloads;
        template.analytics.usage.activeProjects += randomProjects;
        
        // Update satisfaction based on recent reviews
        const recentReviews = Array.from(this.reviews.values())
          .filter(r => r.templateId === templateId)
          .filter(r => r.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // last 7 days
        
        if (recentReviews.length > 0) {
          const avgRating = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
          template.analytics.usage.userSatisfaction = avgRating;
        }
      }
    }
  }

  // Template management methods
  async getTemplatesByNR(nr, filters = {}) {
    try {
      let templates = Array.from(this.templates.values())
        .filter(template => template.category === nr);
      
      // Apply filters
      if (filters.difficulty) {
        templates = templates.filter(t => t.difficulty === filters.difficulty);
      }
      
      if (filters.industry) {
        templates = templates.filter(t => 
          t.industry && t.industry.includes(filters.industry)
        );
      }
      
      if (filters.duration) {
        const [min, max] = filters.duration.split('-').map(Number);
        templates = templates.filter(t => 
          t.duration >= min * 60 && t.duration <= max * 60
        );
      }
      
      if (filters.language) {
        templates = templates.filter(t => t.language === filters.language);
      }
      
      if (filters.hasVR !== undefined) {
        templates = templates.filter(t => 
          t.content && t.content.hasVR === filters.hasVR
        );
      }
      
      // Sort by relevance/popularity
      templates.sort((a, b) => {
        const aScore = (a.analytics?.usage?.totalDownloads || 0) + 
                      (a.analytics?.usage?.userSatisfaction || 0) * 100;
        const bScore = (b.analytics?.usage?.totalDownloads || 0) + 
                      (b.analytics?.usage?.userSatisfaction || 0) * 100;
        return bScore - aScore;
      });
      
      return templates;
    } catch (error) {
      console.error('Get templates by NR error:', error);
      throw error;
    }
  }

  async getTemplateById(templateId) {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Increment view count
      if (template.analytics && template.analytics.usage) {
        template.analytics.usage.totalViews = 
          (template.analytics.usage.totalViews || 0) + 1;
      }
      
      return template;
    } catch (error) {
      console.error('Get template by ID error:', error);
      throw error;
    }
  }

  async searchTemplates(query, filters = {}) {
    try {
      let templates = Array.from(this.templates.values());
      
      // Apply search query
      if (query) {
        const queryLower = query.toLowerCase();
        templates = templates.filter(template =>
          template.title.toLowerCase().includes(queryLower) ||
          template.description.toLowerCase().includes(queryLower) ||
          template.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
          template.category.toLowerCase().includes(queryLower)
        );
      }
      
      // Apply filters (reuse logic from getTemplatesByNR)
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      
      if (filters.type) {
        templates = templates.filter(t => t.type === filters.type);
      }
      
      if (filters.difficulty) {
        templates = templates.filter(t => t.difficulty === filters.difficulty);
      }
      
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(Number);
        templates = templates.filter(t => 
          t.marketplace && t.marketplace.price >= min && t.marketplace.price <= max
        );
      }
      
      if (filters.rating) {
        const minRating = parseFloat(filters.rating);
        templates = templates.filter(t => 
          t.analytics && t.analytics.usage && 
          t.analytics.usage.userSatisfaction >= minRating
        );
      }
      
      return templates;
    } catch (error) {
      console.error('Search templates error:', error);
      throw error;
    }
  }

  async getTemplatePreview(templateId) {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      return {
        id: template.id,
        title: template.title,
        description: template.description,
        thumbnail: template.thumbnail,
        preview: template.preview,
        duration: template.duration,
        difficulty: template.difficulty,
        scenes: template.content.scenes.map(scene => ({
          id: scene.id,
          title: scene.title,
          type: scene.type,
          duration: scene.duration,
          thumbnail: scene.thumbnail || template.thumbnail
        })),
        features: {
          hasQuiz: template.content.hasQuiz,
          hasCertificate: template.content.hasCertificate,
          hasSimulation: template.content.hasSimulation,
          has3DContent: template.content.has3DContent,
          hasVR: template.content.hasVR,
          hasAR: template.content.hasAR
        },
        analytics: {
          rating: template.analytics?.usage?.userSatisfaction || 0,
          downloads: template.analytics?.usage?.totalDownloads || 0,
          completionRate: template.analytics?.usage?.completionRate || 0
        }
      };
    } catch (error) {
      console.error('Get template preview error:', error);
      throw error;
    }
  }

  // 3D Assets management
  async get3DAssets(filters = {}) {
    try {
      let assets = Array.from(this.assets3D.values());
      
      if (filters.category) {
        assets = assets.filter(asset => asset.category === filters.category);
      }
      
      if (filters.format) {
        assets = assets.filter(asset => asset.format === filters.format);
      }
      
      if (filters.maxFileSize) {
        assets = assets.filter(asset => asset.fileSize <= filters.maxFileSize);
      }
      
      if (filters.vrCompatible !== undefined) {
        assets = assets.filter(asset => asset.vrCompatible === filters.vrCompatible);
      }
      
      return assets;
    } catch (error) {
      console.error('Get 3D assets error:', error);
      throw error;
    }
  }

  async get3DAssetById(assetId) {
    try {
      const asset = this.assets3D.get(assetId);
      if (!asset) {
        throw new Error('3D Asset not found');
      }
      
      return asset;
    } catch (error) {
      console.error('Get 3D asset by ID error:', error);
      throw error;
    }
  }

  // Collections management
  async getCollections(filters = {}) {
    try {
      let collections = Array.from(this.collections.values());
      
      if (filters.category) {
        collections = collections.filter(c => c.category === filters.category);
      }
      
      if (filters.difficulty) {
        collections = collections.filter(c => c.difficulty === filters.difficulty);
      }
      
      if (filters.featured !== undefined) {
        collections = collections.filter(c => c.featured === filters.featured);
      }
      
      return collections;
    } catch (error) {
      console.error('Get collections error:', error);
      throw error;
    }
  }

  async getCollectionById(collectionId) {
    try {
      const collection = this.collections.get(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Get full template data for collection
      const templatesData = [];
      for (const templateId of collection.templates) {
        const template = this.templates.get(templateId);
        if (template) {
          templatesData.push(template);
        }
      }
      
      return {
        ...collection,
        templatesData
      };
    } catch (error) {
      console.error('Get collection by ID error:', error);
      throw error;
    }
  }

  // Learning Paths management
  async getLearningPaths(filters = {}) {
    try {
      let paths = Array.from(this.learningPaths.values());
      
      if (filters.category) {
        paths = paths.filter(p => p.category === filters.category);
      }
      
      if (filters.level) {
        paths = paths.filter(p => p.level === filters.level);
      }
      
      if (filters.certification !== undefined) {
        paths = paths.filter(p => p.certification.available === filters.certification);
      }
      
      return paths;
    } catch (error) {
      console.error('Get learning paths error:', error);
      throw error;
    }
  }

  async getLearningPathById(pathId) {
    try {
      const path = this.learningPaths.get(pathId);
      if (!path) {
        throw new Error('Learning path not found');
      }
      
      // Enrich modules with template data
      const enrichedModules = [];
      for (const module of path.modules) {
        const moduleTemplates = [];
        for (const templateId of module.templates) {
          const template = this.templates.get(templateId);
          if (template) {
            moduleTemplates.push(template);
          }
        }
        
        enrichedModules.push({
          ...module,
          templatesData: moduleTemplates
        });
      }
      
      return {
        ...path,
        modules: enrichedModules
      };
    } catch (error) {
      console.error('Get learning path by ID error:', error);
      throw error;
    }
  }

  // Reviews management
  async getTemplateReviews(templateId, filters = {}) {
    try {
      let reviews = Array.from(this.reviews.values())
        .filter(review => review.templateId === templateId);
      
      if (filters.rating) {
        reviews = reviews.filter(r => r.rating >= filters.rating);
      }
      
      if (filters.verified !== undefined) {
        reviews = reviews.filter(r => r.verified === filters.verified);
      }
      
      // Sort by helpfulness and date
      reviews.sort((a, b) => {
        const aScore = a.helpful + (new Date(a.createdAt).getTime() / 1000000);
        const bScore = b.helpful + (new Date(b.createdAt).getTime() / 1000000);
        return bScore - aScore;
      });
      
      return reviews;
    } catch (error) {
      console.error('Get template reviews error:', error);
      throw error;
    }
  }

  async addTemplateReview(templateId, reviewData, userId) {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Check if user already reviewed this template
      const existingReview = Array.from(this.reviews.values())
        .find(r => r.templateId === templateId && r.userId === userId);
      
      if (existingReview) {
        throw new Error('User already reviewed this template');
      }
      
      const reviewId = 'review_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const review = {
        id: reviewId,
        templateId,
        userId,
        userName: reviewData.userName,
        userRole: reviewData.userRole,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        helpful: 0,
        verified: reviewData.verified || false,
        createdAt: new Date()
      };
      
      this.reviews.set(reviewId, review);
      
      // Update template analytics
      if (template.analytics && template.analytics.feedback) {
        template.analytics.feedback.totalReviews++;
        
        // Recalculate average rating
        const allReviews = Array.from(this.reviews.values())
          .filter(r => r.templateId === templateId);
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        template.analytics.feedback.averageRating = avgRating;
        template.analytics.usage.userSatisfaction = avgRating;
      }
      
      return review;
    } catch (error) {
      console.error('Add template review error:', error);
      throw error;
    }
  }

  // Analytics methods
  async getTemplateAnalytics(templateId, timeRange = '30d') {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      const analytics = template.analytics || {};
      
      // Generate time-based analytics
      const days = parseInt(timeRange.replace('d', ''));
      const dailyData = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        dailyData.push({
          date: date.toISOString().split('T')[0],
          downloads: Math.floor(Math.random() * 10),
          views: Math.floor(Math.random() * 50),
          projects: Math.floor(Math.random() * 5)
        });
      }
      
      return {
        templateId,
        timeRange,
        summary: analytics.usage || {},
        performance: analytics.performance || {},
        feedback: analytics.feedback || {},
        dailyData,
        trends: {
          downloadsGrowth: Math.random() * 20 - 10, // -10% to +10%
          satisfactionTrend: Math.random() * 1 - 0.5, // -0.5 to +0.5
          usageGrowth: Math.random() * 30 - 15 // -15% to +15%
        }
      };
    } catch (error) {
      console.error('Get template analytics error:', error);
      throw error;
    }
  }

  // Customization methods
  async customizeTemplate(templateId, customizations, userId) {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      if (!template.customization || !template.customization.allowContentEdit) {
        throw new Error('Template customization not allowed');
      }
      
      // Create customized version
      const customizedTemplate = JSON.parse(JSON.stringify(template));
      customizedTemplate.id = 'custom_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      customizedTemplate.title = customizations.title || template.title;
      customizedTemplate.description = customizations.description || template.description;
      customizedTemplate.customizedBy = userId;
      customizedTemplate.customizedAt = new Date();
      customizedTemplate.baseTemplate = templateId;
      
      // Apply customizations
      if (customizations.branding) {
        customizedTemplate.branding = customizations.branding;
      }
      
      if (customizations.content) {
        customizedTemplate.content = {
          ...customizedTemplate.content,
          ...customizations.content
        };
      }
      
      if (customizations.customFields) {
        customizedTemplate.customFields = customizations.customFields;
      }
      
      this.templates.set(customizedTemplate.id, customizedTemplate);
      
      return customizedTemplate;
    } catch (error) {
      console.error('Customize template error:', error);
      throw error;
    }
  }

  // Utility methods
  async getCategories() {
    try {
      return Array.from(this.categories.values());
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }

  async getCategoryById(categoryId) {
    try {
      const category = this.categories.get(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
      
      return category;
    } catch (error) {
      console.error('Get category by ID error:', error);
      throw error;
    }
  }

  async getRecommendations(userId, templateId = null) {
    try {
      let templates = Array.from(this.templates.values());
      
      // Simple recommendation algorithm based on popularity and ratings
      templates = templates
        .filter(t => t.id !== templateId) // Exclude current template
        .sort((a, b) => {
          const aScore = (a.analytics?.usage?.totalDownloads || 0) * 0.3 +
                        (a.analytics?.usage?.userSatisfaction || 0) * 0.7;
          const bScore = (b.analytics?.usage?.totalDownloads || 0) * 0.3 +
                        (b.analytics?.usage?.userSatisfaction || 0) * 0.7;
          return bScore - aScore;
        })
        .slice(0, 6); // Top 6 recommendations
      
      return templates;
    } catch (error) {
      console.error('Get recommendations error:', error);
      throw error;
    }
  }

  // Cleanup method
  destroy() {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }
  }
}

module.exports = new TemplatesService();