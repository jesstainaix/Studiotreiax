// Constantes do Estúdio IA de Vídeos

import type { NRCategory, ProjectSettings } from '../types'

// Categorias de Normas Regulamentadoras
export const NR_CATEGORIES: Record<NRCategory, { name: string; description: string; color: string }> = {
  'NR-06': {
    name: 'NR-06 - Equipamentos de Proteção Individual',
    description: 'Uso e fornecimento de EPIs',
    color: '#3B82F6'
  },
  'NR-10': {
    name: 'NR-10 - Segurança em Instalações Elétricas',
    description: 'Segurança em serviços com eletricidade',
    color: '#F59E0B'
  },
  'NR-12': {
    name: 'NR-12 - Segurança no Trabalho em Máquinas',
    description: 'Segurança em máquinas e equipamentos',
    color: '#EF4444'
  },
  'NR-18': {
    name: 'NR-18 - Condições de Segurança na Construção',
    description: 'Segurança na construção civil',
    color: '#10B981'
  },
  'NR-33': {
    name: 'NR-33 - Segurança em Espaços Confinados',
    description: 'Trabalho em espaços confinados',
    color: '#8B5CF6'
  },
  'NR-35': {
    name: 'NR-35 - Trabalho em Altura',
    description: 'Segurança em trabalhos em altura',
    color: '#F97316'
  }
}

// Configurações padrão de projeto
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  resolution: '1080p',
  format: 'mp4',
  fps: 30,
  background_music: false
}

// Durações padrão por tipo de slide (em milissegundos)
export const DEFAULT_SLIDE_DURATIONS = {
  intro: 8000,
  content: 12000,
  demonstration: 15000,
  conclusion: 6000,
  quiz: 10000
}

// Configurações do editor
export const EDITOR_CONFIG = {
  canvas: {
    width: 1920,
    height: 1080,
    background: '#000000'
  },
  grid: {
    size: 20,
    color: '#333333',
    opacity: 0.3
  },
  zoom: {
    min: 0.1,
    max: 5.0,
    step: 0.1,
    default: 1.0
  },
  history: {
    maxEntries: 100
  },
  autosave: {
    interval: 30000 // 30 segundos
  }
}

// Tipos de animação disponíveis
export const ANIMATION_TYPES = {
  entrance: [
    { id: 'fadeIn', name: 'Fade In', duration: 1000 },
    { id: 'slideInLeft', name: 'Slide In Left', duration: 800 },
    { id: 'slideInRight', name: 'Slide In Right', duration: 800 },
    { id: 'slideInUp', name: 'Slide In Up', duration: 800 },
    { id: 'slideInDown', name: 'Slide In Down', duration: 800 },
    { id: 'zoomIn', name: 'Zoom In', duration: 600 },
    { id: 'rotateIn', name: 'Rotate In', duration: 1000 },
    { id: 'bounce', name: 'Bounce', duration: 1200 }
  ],
  exit: [
    { id: 'fadeOut', name: 'Fade Out', duration: 1000 },
    { id: 'slideOutLeft', name: 'Slide Out Left', duration: 800 },
    { id: 'slideOutRight', name: 'Slide Out Right', duration: 800 },
    { id: 'slideOutUp', name: 'Slide Out Up', duration: 800 },
    { id: 'slideOutDown', name: 'Slide Out Down', duration: 800 },
    { id: 'zoomOut', name: 'Zoom Out', duration: 600 },
    { id: 'rotateOut', name: 'Rotate Out', duration: 1000 }
  ],
  emphasis: [
    { id: 'pulse', name: 'Pulse', duration: 1500 },
    { id: 'highlight', name: 'Highlight', duration: 2000 },
    { id: 'emphasize', name: 'Emphasize', duration: 1000 }
  ]
}

// Configurações de qualidade de renderização
export const RENDER_QUALITIES = {
  '360p': { width: 640, height: 360, bitrate: '1000k' },
  '720p': { width: 1280, height: 720, bitrate: '2500k' },
  '1080p': { width: 1920, height: 1080, bitrate: '5000k' },
  '4k': { width: 3840, height: 2160, bitrate: '15000k' }
}

// Formatos de exportação
export const EXPORT_FORMATS = {
  mp4: { name: 'MP4', extension: '.mp4', mime: 'video/mp4' },
  mov: { name: 'MOV', extension: '.mov', mime: 'video/quicktime' },
  webm: { name: 'WebM', extension: '.webm', mime: 'video/webm' }
}

// Configurações de upload
export const UPLOAD_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: {
    pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    videos: ['video/mp4', 'video/mov', 'video/webm'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg']
  },
  chunkSize: 1024 * 1024 // 1MB chunks
}

// Configurações de TTS
export const TTS_PROVIDERS = {
  elevenlabs: {
    name: 'ElevenLabs',
    description: 'Vozes premium ultra-realistas',
    maxCharacters: 5000,
    languages: ['pt-BR', 'en-US'],
    isPremium: true
  },
  azure: {
    name: 'Azure Cognitive Services',
    description: 'Síntese profissional da Microsoft',
    maxCharacters: 10000,
    languages: ['pt-BR', 'en-US', 'es-ES'],
    isPremium: true
  },
  google: {
    name: 'Google Cloud TTS',
    description: 'Vozes neurais do Google',
    maxCharacters: 8000,
    languages: ['pt-BR', 'en-US', 'es-ES'],
    isPremium: true
  },
  synthetic: {
    name: 'Web Speech API',
    description: 'Síntese básica do navegador',
    maxCharacters: 1000,
    languages: ['pt-BR', 'en-US'],
    isPremium: false
  }
}

// Configurações de avatar
export const AVATAR_CONFIG = {
  defaultExpressions: [
    'neutral', 'happy', 'serious', 'concerned', 'confident', 'explaining'
  ],
  defaultGestures: [
    'idle', 'pointing', 'presenting', 'warning', 'thumbs_up', 'stop_gesture'
  ],
  clothingStyles: {
    'NR-06': ['safety_vest', 'hard_hat', 'safety_glasses'],
    'NR-10': ['electrical_suit', 'insulated_gloves', 'safety_helmet'],
    'NR-12': ['work_uniform', 'safety_shoes', 'protective_gloves'],
    'NR-18': ['construction_vest', 'hard_hat', 'safety_harness'],
    'NR-33': ['confined_space_suit', 'gas_detector', 'rescue_equipment'],
    'NR-35': ['height_safety_harness', 'helmet', 'safety_rope']
  }
}

// Configurações de cenários 3D
export const SCENE_3D_CONFIG = {
  lighting: {
    ambient: { intensity: 0.4, color: '#ffffff' },
    directional: { intensity: 0.8, color: '#ffffff' },
    shadows: true,
    shadowMapSize: 2048
  },
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 5, z: 10 }
  },
  renderer: {
    antialias: true,
    shadowMap: true,
    physicallyCorrectLights: true
  }
}

// Configurações de colaboração
export const COLLABORATION_CONFIG = {
  maxCollaborators: 10,
  roles: {
    owner: {
      name: 'Proprietário',
      permissions: {
        can_edit: true,
        can_comment: true,
        can_approve: true,
        can_export: true,
        can_invite: true,
        can_delete: true
      }
    },
    editor: {
      name: 'Editor',
      permissions: {
        can_edit: true,
        can_comment: true,
        can_approve: false,
        can_export: true,
        can_invite: false,
        can_delete: false
      }
    },
    viewer: {
      name: 'Visualizador',
      permissions: {
        can_edit: false,
        can_comment: true,
        can_approve: false,
        can_export: false,
        can_invite: false,
        can_delete: false
      }
    }
  },
  realtime: {
    heartbeatInterval: 30000, // 30 segundos
    reconnectAttempts: 5,
    reconnectDelay: 2000
  }
}

// URLs da API
export const API_ENDPOINTS = {
  auth: '/api/auth',
  projects: '/api/projects',
  upload: '/api/upload',
  tts: '/api/tts',
  avatars: '/api/avatars',
  render: '/api/render',
  templates: '/api/templates',
  collaboration: '/api/collaboration',
  websocket: '/api/ws'
}

// Configurações de cache
export const CACHE_CONFIG = {
  ttl: {
    projects: 5 * 60 * 1000, // 5 minutos
    templates: 30 * 60 * 1000, // 30 minutos
    avatars: 60 * 60 * 1000, // 1 hora
    voices: 60 * 60 * 1000, // 1 hora
    scenes: 60 * 60 * 1000 // 1 hora
  },
  maxSize: {
    images: 50, // 50 imagens em cache
    audio: 20, // 20 áudios em cache
    models: 10 // 10 modelos 3D em cache
  }
}

// Configurações de performance
export const PERFORMANCE_CONFIG = {
  debounce: {
    search: 300,
    autosave: 1000,
    resize: 100
  },
  throttle: {
    scroll: 16, // ~60fps
    mousemove: 16,
    render: 33 // ~30fps
  },
  lazy: {
    imageThreshold: 100, // pixels
    componentThreshold: 200
  }
}

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  network: 'Erro de conexão. Verifique sua internet.',
  upload: 'Erro no upload. Tente novamente.',
  render: 'Erro na renderização. Contate o suporte.',
  auth: 'Erro de autenticação. Faça login novamente.',
  permission: 'Você não tem permissão para esta ação.',
  fileSize: 'Arquivo muito grande. Máximo 100MB.',
  fileType: 'Tipo de arquivo não suportado.',
  quota: 'Cota excedida. Upgrade sua conta.',
  server: 'Erro interno do servidor. Tente mais tarde.'
}

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  duration: {
    success: 3000,
    error: 5000,
    warning: 4000,
    info: 3000
  },
  position: 'top-right' as const,
  maxNotifications: 5
}