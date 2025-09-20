// Complete list of all 37 Brazilian NRs (Normas Regulamentadoras)
// This file contains the comprehensive mapping of all NR categories

export interface NRCategory {
  id: string
  name: string
  title: string
  description: string
  color: string
  icon: string
  specializations?: string[]
  riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
  targetAudience: string[]
}

export const allNRCategories: NRCategory[] = [
  {
    id: 'nr-01',
    name: 'NR-01',
    title: 'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
    description: 'Estabelece disposições gerais, campo de aplicação, termos e definições comuns às Normas Regulamentadoras',
    color: 'bg-slate-500',
    icon: '📋',
    specializations: ['Gestão de SST', 'Programa de Gerenciamento de Riscos', 'Inventário de Riscos'],
    riskLevel: 'Médio',
    targetAudience: ['Gestores', 'SESMT', 'CIPA', 'Supervisores']
  },
  {
    id: 'nr-02',
    name: 'NR-02',
    title: 'Inspeção Prévia',
    description: 'Estabelece os procedimentos obrigatórios para inspeção prévia de estabelecimentos',
    color: 'bg-indigo-500',
    icon: '🔍',
    specializations: ['Inspeção de Estabelecimentos', 'Licenciamento', 'Avaliação Prévia'],
    riskLevel: 'Médio',
    targetAudience: ['Inspetores', 'Engenheiros', 'Técnicos de Segurança']
  },
  {
    id: 'nr-03',
    name: 'NR-03',
    title: 'Embargo ou Interdição',
    description: 'Define os procedimentos para embargo ou interdição de estabelecimentos, obras ou equipamentos',
    color: 'bg-red-700',
    icon: '🚫',
    specializations: ['Procedimentos de Embargo', 'Interdição de Equipamentos', 'Medidas Cautelares'],
    riskLevel: 'Crítico',
    targetAudience: ['Auditores Fiscais', 'Gestores', 'Engenheiros']
  },
  {
    id: 'nr-04',
    name: 'NR-04',
    title: 'Serviços Especializados em Engenharia de Segurança e em Medicina do Trabalho',
    description: 'Estabelece a obrigatoriedade de manutenção de Serviços Especializados em Engenharia de Segurança e em Medicina do Trabalho',
    color: 'bg-emerald-500',
    icon: '🏥',
    specializations: ['SESMT', 'Dimensionamento', 'Atribuições Profissionais'],
    riskLevel: 'Médio',
    targetAudience: ['Médicos do Trabalho', 'Engenheiros de Segurança', 'Técnicos de Segurança']
  },
  {
    id: 'nr-05',
    name: 'NR-05',
    title: 'Comissão Interna de Prevenção de Acidentes',
    description: 'Estabelece a obrigatoriedade de constituição de Comissão Interna de Prevenção de Acidentes',
    color: 'bg-cyan-500',
    icon: '👥',
    specializations: ['Constituição da CIPA', 'Atribuições', 'Treinamento'],
    riskLevel: 'Médio',
    targetAudience: ['Cipeiros', 'Gestores', 'Trabalhadores']
  },
  {
    id: 'nr-06',
    name: 'NR-06',
    title: 'Equipamento de Proteção Individual - EPI',
    description: 'Estabelece os requisitos para fornecimento e uso de equipamentos de proteção individual',
    color: 'bg-blue-500',
    icon: '🦺',
    specializations: ['Seleção de EPIs', 'Treinamento', 'Controle de Qualidade'],
    riskLevel: 'Alto',
    targetAudience: ['Todos os Trabalhadores', 'Supervisores', 'Compradores']
  },
  {
    id: 'nr-07',
    name: 'NR-07',
    title: 'Programa de Controle Médico de Saúde Ocupacional',
    description: 'Estabelece a obrigatoriedade de elaboração e implementação do Programa de Controle Médico de Saúde Ocupacional',
    color: 'bg-pink-500',
    icon: '🩺',
    specializations: ['PCMSO', 'Exames Médicos', 'Vigilância da Saúde'],
    riskLevel: 'Alto',
    targetAudience: ['Médicos do Trabalho', 'Gestores', 'Trabalhadores']
  },
  {
    id: 'nr-08',
    name: 'NR-08',
    title: 'Edificações',
    description: 'Estabelece requisitos técnicos mínimos que devem ser observados nas edificações',
    color: 'bg-stone-500',
    icon: '🏢',
    specializations: ['Projeto de Edificações', 'Circulação', 'Proteção contra Intempéries'],
    riskLevel: 'Médio',
    targetAudience: ['Arquitetos', 'Engenheiros', 'Construtores']
  },
  {
    id: 'nr-09',
    name: 'NR-09',
    title: 'Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos',
    description: 'Estabelece os requisitos para avaliação das exposições ocupacionais a agentes físicos, químicos e biológicos',
    color: 'bg-violet-500',
    icon: '🧪',
    specializations: ['Higiene Ocupacional', 'Monitoramento Ambiental', 'Controle de Exposição'],
    riskLevel: 'Alto',
    targetAudience: ['Higienistas', 'Técnicos de Segurança', 'Engenheiros']
  },
  {
    id: 'nr-10',
    name: 'NR-10',
    title: 'Segurança em Instalações e Serviços em Eletricidade',
    description: 'Estabelece os requisitos e condições mínimas para garantir a segurança dos trabalhadores que interagem com instalações elétricas',
    color: 'bg-yellow-500',
    icon: '⚡',
    specializations: ['SEP', 'Análise de Risco Elétrico', 'Procedimentos de Trabalho'],
    riskLevel: 'Crítico',
    targetAudience: ['Eletricistas', 'Engenheiros Eletricistas', 'Técnicos']
  },
  {
    id: 'nr-11',
    name: 'NR-11',
    title: 'Transporte, Movimentação, Armazenagem e Manuseio de Materiais',
    description: 'Estabelece os requisitos de segurança para operação de elevadores, guindastes, transportadores industriais e máquinas transportadoras',
    color: 'bg-amber-600',
    icon: '🏗️',
    specializations: ['Operação de Guindastes', 'Movimentação de Cargas', 'Armazenagem'],
    riskLevel: 'Alto',
    targetAudience: ['Operadores', 'Estivadores', 'Almoxarifes']
  },
  {
    id: 'nr-12',
    name: 'NR-12',
    title: 'Segurança no Trabalho em Máquinas e Equipamentos',
    description: 'Estabelece as medidas de proteção para o trabalho em máquinas e equipamentos',
    color: 'bg-orange-500',
    icon: '⚙️',
    specializations: ['Dispositivos de Segurança', 'Manutenção', 'Capacitação'],
    riskLevel: 'Crítico',
    targetAudience: ['Operadores', 'Mecânicos', 'Supervisores']
  },
  {
    id: 'nr-13',
    name: 'NR-13',
    title: 'Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento',
    description: 'Estabelece requisitos mínimos para gestão da integridade estrutural de caldeiras a vapor, vasos de pressão, suas tubulações de interligação e tanques metálicos de armazenamento',
    color: 'bg-red-600',
    icon: '🔥',
    specializations: ['Inspeção de Caldeiras', 'Vasos de Pressão', 'Operação Segura'],
    riskLevel: 'Crítico',
    targetAudience: ['Operadores', 'Inspetores', 'Engenheiros']
  },
  {
    id: 'nr-14',
    name: 'NR-14',
    title: 'Fornos',
    description: 'Estabelece os requisitos mínimos para instalação, operação e manutenção de fornos industriais',
    color: 'bg-orange-600',
    icon: '🔥',
    specializations: ['Operação de Fornos', 'Manutenção', 'Controle de Temperatura'],
    riskLevel: 'Alto',
    targetAudience: ['Operadores', 'Forneiros', 'Técnicos']
  },
  {
    id: 'nr-15',
    name: 'NR-15',
    title: 'Atividades e Operações Insalubres',
    description: 'Estabelece as atividades ou operações insalubres que são executadas acima dos limites de tolerância',
    color: 'bg-purple-600',
    icon: '☣️',
    specializations: ['Avaliação de Insalubridade', 'Limites de Tolerância', 'Caracterização'],
    riskLevel: 'Alto',
    targetAudience: ['Higienistas', 'Peritos', 'Trabalhadores Expostos']
  },
  {
    id: 'nr-16',
    name: 'NR-16',
    title: 'Atividades e Operações Perigosas',
    description: 'Estabelece as atividades e operações perigosas com explosivos, inflamáveis, radiações ionizantes, etc.',
    color: 'bg-red-800',
    icon: '💥',
    specializations: ['Trabalho com Explosivos', 'Radiações Ionizantes', 'Inflamáveis'],
    riskLevel: 'Crítico',
    targetAudience: ['Trabalhadores Especializados', 'Supervisores', 'Técnicos']
  },
  {
    id: 'nr-17',
    name: 'NR-17',
    title: 'Ergonomia',
    description: 'Estabelece parâmetros que permitam a adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores',
    color: 'bg-green-500',
    icon: '🪑',
    specializations: ['Análise Ergonômica', 'Posto de Trabalho', 'Organização do Trabalho'],
    riskLevel: 'Médio',
    targetAudience: ['Todos os Trabalhadores', 'Ergonomistas', 'Gestores']
  },
  {
    id: 'nr-18',
    name: 'NR-18',
    title: 'Condições e Meio Ambiente de Trabalho na Indústria da Construção',
    description: 'Estabelece diretrizes de ordem administrativa, de planejamento e de organização para a indústria da construção',
    color: 'bg-amber-500',
    icon: '🏗️',
    specializations: ['PCMAT', 'Trabalho em Altura', 'Escavações'],
    riskLevel: 'Crítico',
    targetAudience: ['Trabalhadores da Construção', 'Engenheiros', 'Técnicos']
  },
  {
    id: 'nr-19',
    name: 'NR-19',
    title: 'Explosivos',
    description: 'Estabelece as disposições regulamentares sobre depósito, manuseio e armazenagem de explosivos',
    color: 'bg-red-900',
    icon: '💣',
    specializations: ['Manuseio de Explosivos', 'Armazenagem', 'Transporte'],
    riskLevel: 'Crítico',
    targetAudience: ['Blasters', 'Supervisores', 'Técnicos Especializados']
  },
  {
    id: 'nr-20',
    name: 'NR-20',
    title: 'Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis',
    description: 'Estabelece requisitos mínimos para a gestão da segurança e saúde no trabalho contra os fatores de risco de acidentes provenientes das atividades de extração, produção, armazenamento, transferência, manuseio e manipulação de inflamáveis e líquidos combustíveis',
    color: 'bg-orange-700',
    icon: '⛽',
    specializations: ['Análise de Riscos', 'Plano de Resposta a Emergências', 'Permissão de Trabalho'],
    riskLevel: 'Crítico',
    targetAudience: ['Operadores', 'Técnicos', 'Bombeiros Industriais']
  },
  {
    id: 'nr-21',
    name: 'NR-21',
    title: 'Trabalhos a Céu Aberto',
    description: 'Estabelece os cuidados a serem dispensados à organização e ao ambiente de trabalho a céu aberto',
    color: 'bg-sky-500',
    icon: '☀️',
    specializations: ['Proteção Solar', 'Abrigos', 'Água Potável'],
    riskLevel: 'Médio',
    targetAudience: ['Trabalhadores Rurais', 'Construção Civil', 'Operadores']
  },
  {
    id: 'nr-22',
    name: 'NR-22',
    title: 'Segurança e Saúde Ocupacional na Mineração',
    description: 'Estabelece os requisitos mínimos para organização e ambiente de trabalho nas atividades de mineração',
    color: 'bg-stone-600',
    icon: '⛏️',
    specializations: ['Mineração Subterrânea', 'Mineração a Céu Aberto', 'Beneficiamento'],
    riskLevel: 'Crítico',
    targetAudience: ['Mineiros', 'Supervisores', 'Engenheiros de Minas']
  },
  {
    id: 'nr-23',
    name: 'NR-23',
    title: 'Proteção Contra Incêndios',
    description: 'Estabelece as medidas de proteção contra incêndios que devem dispor os locais de trabalho',
    color: 'bg-red-600',
    icon: '🔥',
    specializations: ['Prevenção de Incêndios', 'Combate a Incêndios', 'Rotas de Fuga'],
    riskLevel: 'Alto',
    targetAudience: ['Brigadistas', 'Todos os Trabalhadores', 'Bombeiros']
  },
  {
    id: 'nr-24',
    name: 'NR-24',
    title: 'Condições Sanitárias e de Conforto nos Locais de Trabalho',
    description: 'Estabelece as condições sanitárias e de conforto a serem observadas nos locais de trabalho',
    color: 'bg-teal-500',
    icon: '🚿',
    specializations: ['Instalações Sanitárias', 'Vestiários', 'Refeitórios'],
    riskLevel: 'Baixo',
    targetAudience: ['Gestores', 'Trabalhadores', 'Arquitetos']
  },
  {
    id: 'nr-25',
    name: 'NR-25',
    title: 'Resíduos Industriais',
    description: 'Estabelece as medidas preventivas a serem observadas no manuseio de resíduos industriais',
    color: 'bg-green-600',
    icon: '♻️',
    specializations: ['Gestão de Resíduos', 'Tratamento', 'Disposição Final'],
    riskLevel: 'Alto',
    targetAudience: ['Operadores', 'Técnicos Ambientais', 'Gestores']
  },
  {
    id: 'nr-26',
    name: 'NR-26',
    title: 'Sinalização de Segurança',
    description: 'Estabelece a padronização das cores e sinais de segurança nos ambientes de trabalho',
    color: 'bg-yellow-600',
    icon: '🚸',
    specializations: ['Cores de Segurança', 'Sinalização', 'Rotulagem'],
    riskLevel: 'Médio',
    targetAudience: ['Designers', 'Técnicos de Segurança', 'Supervisores']
  },
  {
    id: 'nr-27',
    name: 'NR-27',
    title: 'Registro Profissional do Técnico de Segurança do Trabalho',
    description: 'Estabelece o registro profissional do Técnico de Segurança do Trabalho no Ministério do Trabalho',
    color: 'bg-indigo-600',
    icon: '📜',
    specializations: ['Registro Profissional', 'Atribuições', 'Fiscalização'],
    riskLevel: 'Baixo',
    targetAudience: ['Técnicos de Segurança', 'Gestores', 'Órgãos Fiscalizadores']
  },
  {
    id: 'nr-28',
    name: 'NR-28',
    title: 'Fiscalização e Penalidades',
    description: 'Estabelece os procedimentos a serem adotados pela fiscalização trabalhista de segurança e saúde no trabalho',
    color: 'bg-gray-600',
    icon: '⚖️',
    specializations: ['Procedimentos de Fiscalização', 'Penalidades', 'Recursos'],
    riskLevel: 'Médio',
    targetAudience: ['Auditores Fiscais', 'Gestores', 'Advogados']
  },
  {
    id: 'nr-29',
    name: 'NR-29',
    title: 'Norma Regulamentadora de Segurança e Saúde no Trabalho Portuário',
    description: 'Estabelece os requisitos de segurança e saúde no trabalho portuário',
    color: 'bg-blue-600',
    icon: '🚢',
    specializations: ['Operações Portuárias', 'Movimentação de Cargas', 'Trabalho Aquaviário'],
    riskLevel: 'Alto',
    targetAudience: ['Portuários', 'Estivadores', 'Operadores']
  },
  {
    id: 'nr-30',
    name: 'NR-30',
    title: 'Segurança e Saúde no Trabalho Aquaviário',
    description: 'Estabelece os requisitos de segurança e saúde no trabalho aquaviário',
    color: 'bg-cyan-600',
    icon: '⛵',
    specializations: ['Navegação', 'Embarcações', 'Trabalho Marítimo'],
    riskLevel: 'Alto',
    targetAudience: ['Marítimos', 'Aquaviários', 'Comandantes']
  },
  {
    id: 'nr-31',
    name: 'NR-31',
    title: 'Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura',
    description: 'Estabelece os preceitos a serem observados na organização e no ambiente de trabalho rural',
    color: 'bg-lime-600',
    icon: '🌾',
    specializations: ['Agrotóxicos', 'Máquinas Agrícolas', 'Trabalho Rural'],
    riskLevel: 'Alto',
    targetAudience: ['Trabalhadores Rurais', 'Produtores', 'Técnicos Agrícolas']
  },
  {
    id: 'nr-32',
    name: 'NR-32',
    title: 'Segurança e Saúde no Trabalho em Serviços de Saúde',
    description: 'Estabelece as diretrizes básicas para a implementação de medidas de proteção à segurança e à saúde dos trabalhadores dos serviços de saúde',
    color: 'bg-rose-500',
    icon: '🏥',
    specializations: ['Riscos Biológicos', 'Radiações', 'Resíduos de Serviços de Saúde'],
    riskLevel: 'Alto',
    targetAudience: ['Profissionais de Saúde', 'Técnicos', 'Auxiliares']
  },
  {
    id: 'nr-33',
    name: 'NR-33',
    title: 'Segurança e Saúde nos Trabalhos em Espaços Confinados',
    description: 'Estabelece os requisitos mínimos para identificação de espaços confinados e o reconhecimento, avaliação, monitoramento e controle dos riscos existentes',
    color: 'bg-purple-500',
    icon: '🕳️',
    specializations: ['Identificação de Espaços Confinados', 'Monitoramento', 'Resgate'],
    riskLevel: 'Crítico',
    targetAudience: ['Trabalhadores Autorizados', 'Vigias', 'Supervisores']
  },
  {
    id: 'nr-34',
    name: 'NR-34',
    title: 'Condições e Meio Ambiente de Trabalho na Indústria da Construção, Reparação e Desmonte Naval',
    description: 'Estabelece os requisitos mínimos e as medidas de proteção à segurança, à saúde e ao meio ambiente de trabalho nas atividades da indústria de construção e reparação naval',
    color: 'bg-slate-600',
    icon: '🛳️',
    specializations: ['Construção Naval', 'Soldagem', 'Trabalho em Altura'],
    riskLevel: 'Crítico',
    targetAudience: ['Trabalhadores Navais', 'Soldadores', 'Técnicos']
  },
  {
    id: 'nr-35',
    name: 'NR-35',
    title: 'Trabalho em Altura',
    description: 'Estabelece os requisitos mínimos e as medidas de proteção para o trabalho em altura',
    color: 'bg-red-500',
    icon: '🏗️',
    specializations: ['Análise de Risco', 'Sistemas de Proteção', 'Resgate'],
    riskLevel: 'Crítico',
    targetAudience: ['Trabalhadores em Altura', 'Supervisores', 'Resgatistas']
  },
  {
    id: 'nr-36',
    name: 'NR-36',
    title: 'Segurança e Saúde no Trabalho em Empresas de Abate e Processamento de Carnes e Derivados',
    description: 'Estabelece os requisitos mínimos para a avaliação, controle e monitoramento dos riscos existentes nas atividades desenvolvidas na indústria de abate e processamento de carnes e derivados',
    color: 'bg-red-400',
    icon: '🥩',
    specializations: ['Ergonomia', 'Riscos Biológicos', 'Ambiente Térmico'],
    riskLevel: 'Alto',
    targetAudience: ['Trabalhadores de Frigoríficos', 'Supervisores', 'Técnicos']
  },
  {
    id: 'nr-37',
    name: 'NR-37',
    title: 'Segurança e Saúde em Plataformas de Petróleo',
    description: 'Estabelece os requisitos mínimos de segurança, saúde e condições de vivência no trabalho a bordo de plataformas de petróleo',
    color: 'bg-black',
    icon: '🛢️',
    specializations: ['Operações Offshore', 'Emergências', 'Heliporto'],
    riskLevel: 'Crítico',
    targetAudience: ['Trabalhadores Offshore', 'Operadores', 'Técnicos']
  }
]

// Helper functions
export const getNRByNumber = (nrNumber: string): NRCategory | undefined => {
  return allNRCategories.find(nr => nr.name === nrNumber)
}

export const getNRsByRiskLevel = (riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'): NRCategory[] => {
  return allNRCategories.filter(nr => nr.riskLevel === riskLevel)
}

export const getCriticalNRs = (): NRCategory[] => {
  return getNRsByRiskLevel('Crítico')
}

export const getImplementedNRs = (): string[] => {
  return ['NR-06', 'NR-10', 'NR-12', 'NR-17', 'NR-18', 'NR-23', 'NR-33', 'NR-35']
}

export const getMissingNRs = (): NRCategory[] => {
  const implemented = getImplementedNRs()
  return allNRCategories.filter(nr => !implemented.includes(nr.name))
}