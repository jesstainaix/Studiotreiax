// 3D Scenarios and Visual Elements for NR Training Templates

export interface ThreeDScenario {
  id: string;
  name: string;
  description: string;
  environment: string;
  interactiveElements: string[];
  riskSimulations: string[];
  equipmentModels: string[];
  difficulty: 'Básico' | 'Intermediário' | 'Avançado';
  duration: number; // in minutes
}

export interface VisualElement {
  id: string;
  type: 'animation' | 'infographic' | 'diagram' | 'simulation' | 'video';
  title: string;
  description: string;
  tags: string[];
}

// 3D Scenarios by NR Category
export const threeDScenarios: Record<string, ThreeDScenario[]> = {
  'NR-01': [
    {
      id: '3d-nr01-001',
      name: 'Escritório Virtual - Disposições Gerais',
      description: 'Ambiente de escritório 3D para demonstrar aplicação das disposições gerais',
      environment: 'office_environment',
      interactiveElements: ['documentos_nr', 'organograma_sesmt', 'fluxo_processos'],
      riskSimulations: ['identificacao_riscos', 'mapeamento_responsabilidades'],
      equipmentModels: ['computadores', 'mobiliario_escritorio'],
      difficulty: 'Básico',
      duration: 15
    }
  ],
  'NR-06': [
    {
      id: '3d-nr06-001',
      name: 'Laboratório Virtual de EPIs',
      description: 'Ambiente 3D para teste e seleção de equipamentos de proteção individual',
      environment: 'safety_lab',
      interactiveElements: ['epi_selector', 'fitting_station', 'quality_tester'],
      riskSimulations: ['improper_use', 'equipment_failure', 'contamination'],
      equipmentModels: ['capacetes', 'luvas', 'oculos', 'mascaras', 'calcados'],
      difficulty: 'Intermediário',
      duration: 25
    },
    {
      id: '3d-nr06-002',
      name: 'Fábrica Virtual - Uso de EPIs',
      description: 'Simulação de ambiente industrial para prática de uso correto de EPIs',
      environment: 'industrial_floor',
      interactiveElements: ['workstations', 'hazard_zones', 'safety_checkpoints'],
      riskSimulations: ['chemical_exposure', 'noise_hazards', 'falling_objects'],
      equipmentModels: ['protetor_auricular', 'respiradores', 'cintos_seguranca'],
      difficulty: 'Avançado',
      duration: 30
    }
  ],
  'NR-10': [
    {
      id: '3d-nr10-001',
      name: 'Subestação Elétrica Virtual',
      description: 'Ambiente 3D de subestação para treinamento em segurança elétrica',
      environment: 'electrical_substation',
      interactiveElements: ['control_panels', 'isolation_switches', 'safety_barriers'],
      riskSimulations: ['arc_flash', 'electrical_shock', 'equipment_malfunction'],
      equipmentModels: ['transformadores', 'disjuntores', 'medidores', 'cabos_alta_tensao'],
      difficulty: 'Avançado',
      duration: 45
    },
    {
      id: '3d-nr10-002',
      name: 'Painel Elétrico Residencial',
      description: 'Simulação 3D de instalações elétricas residenciais',
      environment: 'residential_electrical',
      interactiveElements: ['circuit_breakers', 'wiring_systems', 'grounding_points'],
      riskSimulations: ['short_circuit', 'overload', 'improper_grounding'],
      equipmentModels: ['quadro_distribuicao', 'tomadas', 'interruptores'],
      difficulty: 'Básico',
      duration: 20
    }
  ],
  'NR-12': [
    {
      id: '3d-nr12-001',
      name: 'Linha de Produção Automatizada',
      description: 'Ambiente 3D de linha de produção com máquinas e equipamentos',
      environment: 'automated_production_line',
      interactiveElements: ['machine_controls', 'safety_guards', 'emergency_stops'],
      riskSimulations: ['crushing_hazards', 'entanglement', 'machine_malfunction'],
      equipmentModels: ['prensas', 'esteiras', 'robos_industriais', 'sensores_seguranca'],
      difficulty: 'Avançado',
      duration: 40
    }
  ],
  'NR-17': [
    {
      id: '3d-nr17-001',
      name: 'Estação de Trabalho Ergonômica',
      description: 'Ambiente 3D para análise e ajuste ergonômico de postos de trabalho',
      environment: 'ergonomic_workstation',
      interactiveElements: ['adjustable_chair', 'monitor_positioning', 'keyboard_tray'],
      riskSimulations: ['repetitive_strain', 'poor_posture', 'eye_strain'],
      equipmentModels: ['cadeiras_ergonomicas', 'mesas_ajustaveis', 'suportes_monitor'],
      difficulty: 'Intermediário',
      duration: 30
    }
  ],
  'NR-18': [
    {
      id: '3d-nr18-001',
      name: 'Canteiro de Obras Virtual',
      description: 'Simulação 3D completa de canteiro de obras com todos os riscos',
      environment: 'construction_site',
      interactiveElements: ['scaffolding_systems', 'crane_operations', 'excavation_areas'],
      riskSimulations: ['falls_from_height', 'struck_by_objects', 'excavation_collapse'],
      equipmentModels: ['andaimes', 'guindastes', 'escavadeiras', 'betoneiras'],
      difficulty: 'Avançado',
      duration: 50
    }
  ],
  'NR-23': [
    {
      id: '3d-nr23-001',
      name: 'Edifício Comercial - Proteção Contra Incêndios',
      description: 'Ambiente 3D de edifício para treinamento em prevenção e combate a incêndios',
      environment: 'commercial_building',
      interactiveElements: ['fire_extinguishers', 'sprinkler_systems', 'emergency_exits'],
      riskSimulations: ['fire_outbreak', 'smoke_propagation', 'evacuation_scenarios'],
      equipmentModels: ['extintores', 'hidrantes', 'detectores_fumaca', 'alarmes'],
      difficulty: 'Intermediário',
      duration: 35
    }
  ],
  'NR-33': [
    {
      id: '3d-nr33-001',
      name: 'Espaço Confinado Industrial',
      description: 'Simulação 3D de tanque industrial para treinamento em espaços confinados',
      environment: 'confined_space',
      interactiveElements: ['entry_permits', 'atmospheric_monitoring', 'rescue_equipment'],
      riskSimulations: ['oxygen_deficiency', 'toxic_gases', 'engulfment'],
      equipmentModels: ['detectores_gas', 'ventiladores', 'equipamentos_resgate'],
      difficulty: 'Avançado',
      duration: 45
    }
  ],
  'NR-35': [
    {
      id: '3d-nr35-001',
      name: 'Torre de Telecomunicações',
      description: 'Ambiente 3D de torre para treinamento em trabalho em altura',
      environment: 'telecommunications_tower',
      interactiveElements: ['climbing_systems', 'anchor_points', 'fall_protection'],
      riskSimulations: ['equipment_failure', 'weather_conditions', 'rescue_scenarios'],
      equipmentModels: ['cintos_seguranca', 'talabartes', 'capacetes', 'cordas'],
      difficulty: 'Avançado',
      duration: 40
    }
  ]
};

// Visual Elements by NR Category
export const visualElements: Record<string, VisualElement[]> = {
  'NR-01': [
    {
      id: 'visual-nr01-001',
      type: 'infographic',
      title: 'Estrutura Organizacional de Segurança',
      description: 'Infográfico mostrando a hierarquia e responsabilidades em segurança do trabalho',
      tags: ['organograma', 'responsabilidades', 'estrutura']
    }
  ],
  'NR-06': [
    {
      id: 'visual-nr06-001',
      type: 'animation',
      title: 'Sequência Correta de Colocação de EPIs',
      description: 'Animação 3D mostrando a ordem correta para vestir equipamentos de proteção',
      tags: ['epi', 'procedimento', 'seguranca']
    },
    {
      id: 'visual-nr06-002',
      type: 'simulation',
      title: 'Teste de Resistência de EPIs',
      description: 'Simulação interativa de testes de qualidade em equipamentos de proteção',
      tags: ['teste', 'qualidade', 'resistencia']
    }
  ],
  'NR-10': [
    {
      id: 'visual-nr10-001',
      type: 'simulation',
      title: 'Arco Elétrico em Slow Motion',
      description: 'Simulação em câmera lenta de formação de arco elétrico',
      tags: ['arco_eletrico', 'perigo', 'eletricidade']
    }
  ],
  'NR-12': [
    {
      id: 'visual-nr12-001',
      type: 'animation',
      title: 'Funcionamento de Dispositivos de Segurança',
      description: 'Animação detalhada do funcionamento de proteções em máquinas',
      tags: ['maquinas', 'protecoes', 'dispositivos']
    }
  ],
  'NR-17': [
    {
      id: 'visual-nr17-001',
      type: 'diagram',
      title: 'Postura Correta no Trabalho',
      description: 'Diagrama anatômico mostrando posturas corretas e incorretas',
      tags: ['ergonomia', 'postura', 'anatomia']
    }
  ],
  'NR-18': [
    {
      id: 'visual-nr18-001',
      type: 'simulation',
      title: 'Simulação de Queda de Objetos',
      description: 'Simulação física de queda de materiais em canteiro de obras',
      tags: ['construcao', 'queda', 'objetos']
    }
  ],
  'NR-23': [
    {
      id: 'visual-nr23-001',
      type: 'simulation',
      title: 'Propagação de Incêndio em Edifício',
      description: 'Simulação realística de como o fogo se propaga em diferentes materiais',
      tags: ['incendio', 'propagacao', 'fogo']
    }
  ],
  'NR-33': [
    {
      id: 'visual-nr33-001',
      type: 'animation',
      title: 'Procedimento de Entrada em Espaço Confinado',
      description: 'Animação passo-a-passo dos procedimentos de segurança',
      tags: ['espaco_confinado', 'procedimento', 'entrada']
    }
  ],
  'NR-35': [
    {
      id: 'visual-nr35-001',
      type: 'simulation',
      title: 'Teste de Equipamentos de Proteção Contra Quedas',
      description: 'Simulação de testes de carga em equipamentos de segurança',
      tags: ['altura', 'equipamentos', 'teste']
    }
  ]
};

// Helper functions
export const getThreeDScenariosByNR = (nr: string): ThreeDScenario[] => {
  return threeDScenarios[nr] || [];
};

export const getVisualElementsByNR = (nr: string): VisualElement[] => {
  return visualElements[nr] || [];
};

export const getAllThreeDScenarios = (): ThreeDScenario[] => {
  return Object.values(threeDScenarios).flat();
};

export const getAllVisualElements = (): VisualElement[] => {
  return Object.values(visualElements).flat();
};

export const getScenariosByDifficulty = (difficulty: 'Básico' | 'Intermediário' | 'Avançado'): ThreeDScenario[] => {
  return getAllThreeDScenarios().filter(scenario => scenario.difficulty === difficulty);
};