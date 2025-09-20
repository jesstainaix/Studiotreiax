import { PlatformPreset } from '../types/export';

export const platformPresets: PlatformPreset[] = [
  // YouTube Presets
  {
    id: 'youtube-1080p',
    name: 'YouTube 1080p',
    platform: 'YouTube',
    description: 'Configuração otimizada para YouTube em Full HD',
    settings: {
      format: 'mp4',
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      videoBitrate: 8000,
      audioBitrate: 128,
      audioSampleRate: 48000,
      codec: 'h264',
      quality: 'high'
    },
    icon: '📺',
    category: 'video'
  },
  {
    id: 'youtube-4k',
    name: 'YouTube 4K',
    platform: 'YouTube',
    description: 'Configuração para YouTube em Ultra HD 4K',
    settings: {
      format: 'mp4',
      resolution: { width: 3840, height: 2160 },
      frameRate: 60,
      videoBitrate: 35000,
      audioBitrate: 128,
      audioSampleRate: 48000,
      codec: 'h265',
      quality: 'ultra'
    },
    icon: '📺',
    category: 'video'
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    platform: 'YouTube',
    description: 'Formato vertical para YouTube Shorts',
    settings: {
      format: 'mp4',
      resolution: { width: 1080, height: 1920 },
      frameRate: 30,
      videoBitrate: 6000,
      audioBitrate: 128,
      audioSampleRate: 48000,
      codec: 'h264',
      quality: 'high'
    },
    icon: '📱',
    category: 'vertical'
  },

  // Instagram Presets
  {
    id: 'instagram-feed',
    name: 'Instagram Feed',
    platform: 'Instagram',
    description: 'Formato quadrado para feed do Instagram',
    settings: {
      format: 'mp4',
      resolution: { width: 1080, height: 1080 },
      frameRate: 30,
      videoBitrate: 3500,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'medium'
    },
    icon: '📷',
    category: 'square'
  },
  {
    id: 'instagram-stories',
    name: 'Instagram Stories',
    platform: 'Instagram',
    description: 'Formato vertical para Stories do Instagram',
    settings: {
      format: 'mp4',
      resolution: { width: 1080, height: 1920 },
      frameRate: 30,
      videoBitrate: 4000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'medium'
    },
    icon: '📱',
    category: 'vertical'
  },
  {
    id: 'instagram-reels',
    name: 'Instagram Reels',
    platform: 'Instagram',
    description: 'Formato otimizado para Reels do Instagram',
    settings: {
      format: 'mp4',
      resolution: { width: 1080, height: 1920 },
      frameRate: 30,
      videoBitrate: 5000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'high'
    },
    icon: '🎬',
    category: 'vertical'
  },
  {
    id: 'instagram-igtv',
    name: 'Instagram IGTV',
    platform: 'Instagram',
    description: 'Formato para vídeos longos no IGTV',
    settings: {
      format: 'mp4',
      resolution: { width: 1080, height: 1920 },
      frameRate: 30,
      videoBitrate: 6000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'high'
    },
    icon: '📺',
    category: 'vertical'
  },

  // TikTok Presets
  {
    id: 'tiktok-standard',
    name: 'TikTok Standard',
    platform: 'TikTok',
    description: 'Formato padrão para TikTok',
    settings: {
      format: 'mp4',
      resolution: { width: 1080, height: 1920 },
      frameRate: 30,
      videoBitrate: 4000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'medium'
    },
    icon: '🎵',
    category: 'vertical'
  },
  {
    id: 'tiktok-hd',
    name: 'TikTok HD',
    platform: 'TikTok',
    description: 'Formato HD para TikTok com melhor qualidade',
    settings: {
      format: 'mp4',
      resolution: { width: 1080, height: 1920 },
      frameRate: 60,
      videoBitrate: 6000,
      audioBitrate: 128,
      audioSampleRate: 48000,
      codec: 'h264',
      quality: 'high'
    },
    icon: '🎵',
    category: 'vertical'
  },

  // Facebook Presets
  {
    id: 'facebook-feed',
    name: 'Facebook Feed',
    platform: 'Facebook',
    description: 'Formato para posts no feed do Facebook',
    settings: {
      format: 'mp4',
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      videoBitrate: 4000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'medium'
    },
    icon: '👥',
    category: 'video'
  },
  {
    id: 'facebook-stories',
    name: 'Facebook Stories',
    platform: 'Facebook',
    description: 'Formato vertical para Stories do Facebook',
    settings: {
      format: 'mp4',
      resolution: { width: 1080, height: 1920 },
      frameRate: 30,
      videoBitrate: 4000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'medium'
    },
    icon: '📱',
    category: 'vertical'
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    platform: 'Facebook',
    description: 'Formato para vídeo de capa do Facebook',
    settings: {
      format: 'mp4',
      resolution: { width: 1200, height: 675 },
      frameRate: 30,
      videoBitrate: 3000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'medium'
    },
    icon: '🖼️',
    category: 'video'
  },

  // LinkedIn Presets
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    platform: 'LinkedIn',
    description: 'Formato para posts no LinkedIn',
    settings: {
      format: 'mp4',
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      videoBitrate: 5000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'high'
    },
    icon: '💼',
    category: 'video'
  },
  {
    id: 'linkedin-story',
    name: 'LinkedIn Story',
    platform: 'LinkedIn',
    description: 'Formato vertical para Stories do LinkedIn',
    settings: {
      format: 'mp4',
      resolution: { width: 1080, height: 1920 },
      frameRate: 30,
      videoBitrate: 4000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'medium'
    },
    icon: '📱',
    category: 'vertical'
  },
  {
    id: 'linkedin-cover',
    name: 'LinkedIn Cover',
    platform: 'LinkedIn',
    description: 'Formato para vídeo de capa do LinkedIn',
    settings: {
      format: 'mp4',
      resolution: { width: 1584, height: 396 },
      frameRate: 30,
      videoBitrate: 3000,
      audioBitrate: 128,
      audioSampleRate: 44100,
      codec: 'h264',
      quality: 'medium'
    },
    icon: '🖼️',
    category: 'video'
  },

  // Generic Presets
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    platform: 'Web',
    description: 'Formato otimizado para web com tamanho reduzido',
    settings: {
      format: 'webm',
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      videoBitrate: 2000,
      audioBitrate: 96,
      audioSampleRate: 44100,
      codec: 'vp9',
      quality: 'medium'
    },
    icon: '🌐',
    category: 'video'
  },
  {
    id: 'gif-animated',
    name: 'GIF Animado',
    platform: 'Universal',
    description: 'Formato GIF para animações curtas',
    settings: {
      format: 'gif',
      resolution: { width: 480, height: 270 },
      frameRate: 15,
      videoBitrate: 0,
      audioBitrate: 0,
      audioSampleRate: 0,
      codec: 'gif',
      quality: 'medium'
    },
    icon: '🎞️',
    category: 'animation'
  }
];

// Função para buscar presets por plataforma
export const getPresetsByPlatform = (platform: string): PlatformPreset[] => {
  return platformPresets.filter(preset => preset.platform === platform);
};

// Função para buscar preset por ID
export const getPresetById = (id: string): PlatformPreset | undefined => {
  return platformPresets.find(preset => preset.id === id);
};

// Função para buscar presets por categoria
export const getPresetsByCategory = (category: string): PlatformPreset[] => {
  return platformPresets.filter(preset => preset.category === category);
};

// Lista de plataformas disponíveis
export const availablePlatforms = [
  'YouTube',
  'Instagram', 
  'TikTok',
  'Facebook',
  'LinkedIn',
  'Web',
  'Universal'
];

// Lista de categorias disponíveis
export const availableCategories = [
  'video',
  'vertical',
  'square',
  'animation'
];