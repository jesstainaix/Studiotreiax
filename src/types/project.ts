export interface ProjectTemplate {
  id: string
  name: string
  title: string
  description: string
  category: string
  nrCategory: string
  difficulty: 'Básico' | 'Intermediário' | 'Avançado'
  thumbnailUrl?: string
  previewUrl?: string
  settings?: Partial<ProjectSettings>
  slides: TemplateSlide[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface TemplateSlide {
  id: string
  order: number
  title: string
  content: Record<string, any>
  layout: string
  elements: SlideElement[]
}

export interface SlideElement {
  id: string
  type: 'text' | 'image' | 'video' | 'shape' | 'chart'
  position: { x: number; y: number; width: number; height: number }
  properties: Record<string, any>
  animations?: Animation[]
}

export interface Animation {
  type: 'fadeIn' | 'slideIn' | 'zoomIn' | 'bounce'
  duration: number
  delay: number
  easing: string
}

export interface Project {
  id: string
  userId: string
  templateId?: string
  title: string
  description?: string
  thumbnailUrl?: string
  status: 'draft' | 'in_progress' | 'completed' | 'published'
  category: string
  nrCategory: string
  difficulty: 'Básico' | 'Intermediário' | 'Avançado'
  duration: number // em minutos
  slidesCount: number
  tags: string[]
  settings: ProjectSettings
  content: Record<string, any>
  metadata: ProjectMetadata
  createdAt: string
  updatedAt: string
}

export interface ProjectSettings {
  resolution: '720p' | '1080p' | '4K'
  fps: 24 | 30 | 60
  frameRate: number
  videoBitrate: number
  audioSampleRate: number
  audioBitrate: number
  audio_quality: 'standard' | 'high' | 'premium'
  watermark: boolean
  auto_captions: boolean
  background_music: boolean
  voice_over: 'ai' | 'human' | 'none'
  language: 'pt-BR' | 'en-US' | 'es-ES'
  autoSave: boolean
  autoSaveInterval: number
  enableCollaboration: boolean
  enableVersioning: boolean
}

export interface ProjectMetadata {
  total_views?: number
  completion_rate?: number
  average_rating?: number
  tags: string[]
  difficulty: 'Básico' | 'Intermediário' | 'Avançado'
  target_audience: string[]
  learning_objectives: string[]
  estimated_completion_time: number // em minutos
}

export interface ProjectLayer {
  id: string
  project_id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'shape'
  name: string
  content: any // JSON com dados específicos do tipo
  position: {
    x: number
    y: number
    z: number // z-index
  }
  size: {
    width: number
    height: number
  }
  timing: {
    start: number // em segundos
    duration: number // em segundos
  }
  style: {
    opacity: number
    rotation: number
    scale: number
    filters?: string[]
  }
  animation?: {
    type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'bounce'
    duration: number
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
    delay: number
  }
  visible: boolean
  locked: boolean
  created_at: string
  updated_at: string
}

export interface ProjectVersion {
  id: string
  project_id: string
  version_number: number
  title: string
  description?: string
  changes_summary: string
  created_at: string
  created_by: string
  is_current: boolean
  backup_data: any // JSON com snapshot do projeto
}

export interface ProjectShare {
  id: string
  project_id: string
  shared_by: string
  shared_with?: string // null para link público
  permission: 'view' | 'edit' | 'admin'
  expires_at?: string
  access_token: string
  created_at: string
  last_accessed?: string
  access_count: number
}

export interface ProjectComment {
  id: string
  project_id: string
  user_id: string
  content: string
  timestamp: number // posição no vídeo em segundos
  status: 'open' | 'resolved' | 'archived'
  replies?: ProjectComment[]
  created_at: string
  updated_at: string
}

// Tipos para criação e atualização
export interface ProjectCreateData {
  title: string
  description?: string
  templateId?: string
  category: string
  nrCategory: string
  difficulty: 'Básico' | 'Intermediário' | 'Avançado'
  tags?: string[]
  settings?: Partial<ProjectSettings>
  content?: Record<string, any>
  metadata?: Partial<ProjectMetadata>
}

export interface ProjectUpdateData {
  title?: string
  description?: string
  status?: Project['status']
  thumbnailUrl?: string
  category?: string
  nrCategory?: string
  difficulty?: 'Básico' | 'Intermediário' | 'Avançado'
  tags?: string[]
  settings?: Partial<ProjectSettings>
  content?: Record<string, any>
  metadata?: Partial<ProjectMetadata>
}

// Tipos para filtros e busca
export interface ProjectFilters {
  status?: Project['status'][]
  category?: string[]
  nrCategory?: string[]
  difficulty?: Project['difficulty'][]
  tags?: string[]
  search?: string
  createdAfter?: string
  createdBefore?: string
  dateRange?: {
    start?: string
    end?: string
  }
}

// Função helper para limpar filtros vazios
export function cleanFilters(filters: Partial<ProjectFilters>): ProjectFilters {
  const clean: ProjectFilters = {}
  
  if (filters.status?.length) clean.status = filters.status
  if (filters.category?.length) clean.category = filters.category
  if (filters.nrCategory?.length) clean.nrCategory = filters.nrCategory
  if (filters.difficulty?.length) clean.difficulty = filters.difficulty
  if (filters.tags?.length) clean.tags = filters.tags
  if (filters.search?.trim()) clean.search = filters.search.trim()
  if (filters.createdAfter?.trim()) clean.createdAfter = filters.createdAfter.trim()
  if (filters.createdBefore?.trim()) clean.createdBefore = filters.createdBefore.trim()
  if (filters.dateRange?.start || filters.dateRange?.end) {
    clean.dateRange = {
      ...(filters.dateRange.start && { start: filters.dateRange.start }),
      ...(filters.dateRange.end && { end: filters.dateRange.end })
    }
  }
  
  return clean
}

export type ProjectSortBy = 'title_asc' | 'title_desc' | 'createdAt_asc' | 'createdAt_desc' | 'updatedAt_asc' | 'updatedAt_desc' | 'status_asc' | 'status_desc' | 'duration_asc' | 'duration_desc'

export interface ProjectSortConfig {
  field: 'title' | 'createdAt' | 'updatedAt' | 'status' | 'duration'
  direction: 'asc' | 'desc'
}

export function projectSortByToConfig(sortBy: ProjectSortBy): ProjectSortConfig {
  const [field, direction] = sortBy.split('_') as [ProjectSortConfig['field'], ProjectSortConfig['direction']]
  return { field, direction }
}

export function projectConfigToSortBy(config: ProjectSortConfig): ProjectSortBy {
  return `${config.field}_${config.direction}` as ProjectSortBy
}

// Interfaces para organização de projetos
export interface ProjectFolder {
  id: string
  name: string
  description: string
  color: string
  parentId: string | null
  projectIds: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectFilterOptions {
  status?: Project['status'][]
  category?: string[]
  nrCategory?: string[]
  difficulty?: Project['difficulty'][]
  tags?: string[]
  folderId?: string
  isStarred?: boolean
  isPublic?: boolean
  createdAfter?: string
  createdBefore?: string
  updatedAfter?: string
  updatedBefore?: string
}

// Tipos para estatísticas
export interface ProjectStats {
  totalProjects: number
  totalDuration: number // em minutos
  averageCompletionTime: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  mostUsedTemplates: Array<{
    templateId: string
    templateName: string
    usageCount: number
  }>
}

// Tipos para exportação
export type ProjectExportFormat = 'mp4' | 'mov' | 'avi' | 'webm'

export interface ProjectExportOptions {
  format: ProjectExportFormat
  quality: 'low' | 'medium' | 'high' | 'ultra'
  includeCaptions: boolean
  includeWatermark: boolean
  customWatermark?: string
}

export interface ProjectExportJob {
  id: string
  projectId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  options: ProjectExportOptions
  outputUrl?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
  estimatedCompletion?: string
}