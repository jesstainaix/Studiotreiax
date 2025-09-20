// Tipos principais do Estúdio IA de Vídeos

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  avatarUrl?: string
  preferences: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  nrCategory?: NRCategory
  settings: ProjectSettings
  status: ProjectStatus
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
  slides?: Slide[]
}

export type NRCategory = 'NR-06' | 'NR-10' | 'NR-12' | 'NR-18' | 'NR-33' | 'NR-35'

export type ProjectStatus = 'draft' | 'editing' | 'rendering' | 'completed'

export interface ProjectSettings {
  resolution: '360p' | '720p' | '1080p' | '4k'
  format: 'mp4' | 'mov' | 'webm'
  fps: 24 | 30 | 60
  duration?: number
  avatarId?: string
  voiceId?: string
  backgroundMusic?: boolean
}

export interface Slide {
  id: string
  projectId: string
  orderIndex: number
  title?: string
  content?: string
  durationMs: number
  layoutData: LayoutData
  backgroundConfig: BackgroundConfig
  elements: Element[]
  audio?: Audio
  createdAt: string
}

export interface LayoutData {
  templateId?: string
  grid: {
    columns: number
    rows: number
  }
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image' | '3d_scene'
  value: string
  sceneId?: string
}

export interface Element {
  id: string
  slideId: string
  type: ElementType
  properties: ElementProperties
  position: Position
  animations: Animation[]
  zIndex: number
  createdAt: string
}

export type ElementType = 'text' | 'image' | 'avatar' | 'shape' | 'video'

export interface ElementProperties {
  // Propriedades comuns
  width: number
  height: number
  opacity: number
  rotation: number
  
  // Propriedades específicas por tipo
  text?: {
    content: string
    fontFamily: string
    fontSize: number
    fontWeight: number
    color: string
    align: 'left' | 'center' | 'right'
  }
  
  image?: {
    src: string
    alt: string
    fit: 'cover' | 'contain' | 'fill'
  }
  
  avatar?: {
    avatarId: string
    expression: string
    gesture: string
    lookAt?: Position
  }
  
  shape?: {
    type: 'rectangle' | 'circle' | 'triangle' | 'arrow'
    fill: string
    stroke: string
    strokeWidth: number
  }
}

export interface Position {
  x: number
  y: number
  z?: number
}

export interface Animation {
  id: string
  type: AnimationType
  duration: number
  delay: number
  easing: string
  properties: Record<string, any>
}

export type AnimationType = 
  | 'fadeIn' | 'fadeOut' 
  | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown'
  | 'zoomIn' | 'zoomOut'
  | 'rotateIn' | 'rotateOut'
  | 'bounce' | 'pulse'
  | 'highlight' | 'emphasize'

export interface Audio {
  id: string
  slideId: string
  audioUrl: string
  durationMs: number
  voiceId?: string
  provider?: TTSProvider
  lipSyncData?: LipSyncData
  createdAt: string
}

export type TTSProvider = 'elevenlabs' | 'azure' | 'google' | 'synthetic'

export interface LipSyncData {
  phonemes: Phoneme[]
  timestamps: number[]
}

export interface Phoneme {
  phoneme: string
  startTime: number
  endTime: number
}

export interface RenderJob {
  id: string
  projectId: string
  status: RenderStatus
  quality: '360p' | '720p' | '1080p' | '4k'
  format: 'mp4' | 'mov' | 'webm'
  outputUrl?: string
  progressPercent: number
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export type RenderStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface Template {
  id: string
  name: string
  description: string
  nrCategory: NRCategory
  thumbnailUrl: string
  slidesCount: number
  durationEstimate: number
  tags: string[]
  isPremium: boolean
  createdAt: string
}

export interface Avatar {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  modelUrl: string
  gender: 'male' | 'female'
  ageRange: 'young' | 'adult' | 'senior'
  ethnicity: string
  clothingStyle: string
  isPremium: boolean
  expressions: string[]
  gestures: string[]
}

export interface Voice {
  id: string
  name: string
  provider: TTSProvider
  language: string
  gender: 'male' | 'female'
  age: 'young' | 'adult' | 'senior'
  accent: string
  style: 'neutral' | 'confident' | 'friendly' | 'professional'
  sampleUrl: string
  isPremium: boolean
}

export interface Scene3D {
  id: string
  name: string
  description: string
  nrCategory: NRCategory
  thumbnailUrl: string
  modelUrl: string
  lightingConfig: LightingConfig
  cameraPositions: CameraPosition[]
  interactiveObjects: InteractiveObject[]
}

export interface LightingConfig {
  ambient: {
    color: string
    intensity: number
  }
  directional: {
    color: string
    intensity: number
    position: Position
    target: Position
  }
  pointLights: PointLight[]
}

export interface PointLight {
  color: string
  intensity: number
  position: Position
  distance: number
}

export interface CameraPosition {
  id: string
  name: string
  position: Position
  target: Position
  fov: number
}

export interface InteractiveObject {
  id: string
  name: string
  type: 'equipment' | 'hazard' | 'safety_item' | 'person'
  position: Position
  modelUrl: string
  animations: string[]
  highlightColor?: string
}

// Tipos para o editor
export interface EditorState {
  project: Project | null
  currentSlideIndex: number
  selectedElementIds: string[]
  clipboard: Element[]
  history: HistoryEntry[]
  historyIndex: number
  isPlaying: boolean
  playbackTime: number
  zoomLevel: number
  viewMode: 'design' | 'preview' | 'timeline'
  gridEnabled: boolean
  snapEnabled: boolean
}

export interface HistoryEntry {
  id: string
  action: 'add' | 'update' | 'delete' | 'move' | 'duplicate'
  elementId?: string
  slideId?: string
  beforeState?: any
  afterState?: any
  timestamp: string
}

// Tipos para colaboração
export interface Collaboration {
  id: string
  projectId: string
  userId: string
  role: CollaborationRole
  permissions: CollaborationPermissions
  status: 'pending' | 'accepted' | 'declined' | 'revoked'
  invitedBy: string
  invitedAt: string
  acceptedAt?: string
  lastActiveAt?: string
}

export type CollaborationRole = 'owner' | 'editor' | 'collaborator' | 'viewer'

export interface CollaborationPermissions {
  can_edit: boolean
  can_comment: boolean
  can_approve: boolean
  can_export: boolean
  can_invite: boolean
  can_delete: boolean
  can_share: boolean
  can_manage_team: boolean
}

export interface Comment {
  id: string
  projectId: string
  slideId?: string
  elementId?: string
  userId: string
  content: string
  position?: Position
  isResolved: boolean
  replies: CommentReply[]
  mentions: string[]
  attachments: CommentAttachment[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface CommentReply {
  id: string
  commentId: string
  userId: string
  content: string
  mentions: string[]
  createdAt: string
  updatedAt: string
}

export interface CommentAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

// Tipos para aprovação e versionamento
export interface ApprovalRequest {
  id: string
  projectId: string
  versionId: string
  requestedBy: string
  assignedTo: string[]
  title: string
  description?: string
  status: ApprovalStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  feedback: ApprovalFeedback[]
  createdAt: string
  updatedAt: string
  approvedAt?: string
  rejectedAt?: string
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface ApprovalFeedback {
  id: string
  userId: string
  action: 'approve' | 'reject' | 'request_changes'
  comment?: string
  attachments: CommentAttachment[]
  createdAt: string
}

export interface ProjectVersion {
  id: string
  projectId: string
  versionNumber: string
  title: string
  description?: string
  createdBy: string
  isCurrentVersion: boolean
  approvalStatus: ApprovalStatus
  snapshotData: Project
  createdAt: string
}

// Tipos para gerenciamento de equipe
export interface Team {
  id: string
  name: string
  description?: string
  ownerId: string
  members: TeamMember[]
  projects: string[]
  settings: TeamSettings
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: TeamRole
  permissions: TeamPermissions
  joinedAt: string
  lastActiveAt?: string
  status: 'active' | 'inactive' | 'suspended'
}

export type TeamRole = 'admin' | 'manager' | 'member' | 'guest'

export interface TeamPermissions {
  can_create_projects: boolean
  can_manage_members: boolean
  can_manage_settings: boolean
  can_delete_team: boolean
  can_view_analytics: boolean
}

export interface TeamSettings {
  isPublic: boolean
  allowMemberInvites: boolean
  defaultProjectPermissions: CollaborationPermissions
  approvalRequired: boolean
  maxMembers?: number
}

export interface TeamInvitation {
  id: string
  teamId: string
  email: string
  role: TeamRole
  invitedBy: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt: string
  createdAt: string
  acceptedAt?: string
}

// Tipos para notificações
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, any>
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  actionUrl?: string
  actionLabel?: string
  createdAt: string
  readAt?: string
  expiresAt?: string
}

export type NotificationType = 
  | 'project_shared'
  | 'comment_added'
  | 'comment_reply'
  | 'comment_mention'
  | 'approval_requested'
  | 'approval_approved'
  | 'approval_rejected'
  | 'team_invitation'
  | 'team_member_joined'
  | 'project_updated'
  | 'render_completed'
  | 'render_failed'
  | 'system_announcement'

export interface NotificationSettings {
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  inAppNotifications: boolean
  notificationTypes: Record<NotificationType, boolean>
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
}

// Tipos para colaboração em tempo real
export interface RealTimeEvent {
  id: string
  type: RealTimeEventType
  projectId: string
  userId: string
  data: Record<string, any>
  timestamp: string
}

export type RealTimeEventType =
  | 'user_joined'
  | 'user_left'
  | 'cursor_moved'
  | 'element_selected'
  | 'element_updated'
  | 'slide_changed'
  | 'comment_added'
  | 'typing_started'
  | 'typing_stopped'

export interface UserPresence {
  userId: string
  projectId: string
  isOnline: boolean
  currentSlideId?: string
  selectedElementIds: string[]
  cursor?: Position
  lastSeen: string
  color: string
}

export interface CollaborationSession {
  id: string
  projectId: string
  participants: UserPresence[]
  startedAt: string
  lastActivityAt: string
}

// Tipos para atividade e auditoria
export interface ActivityLog {
  id: string
  userId: string
  projectId?: string
  teamId?: string
  action: ActivityAction
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export type ActivityAction =
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_shared'
  | 'slide_added'
  | 'slide_updated'
  | 'slide_deleted'
  | 'comment_added'
  | 'approval_requested'
  | 'approval_given'
  | 'team_created'
  | 'team_member_added'
  | 'team_member_removed'
  | 'export_completed'

export interface ProjectActivity {
  projectId: string
  recentActivities: ActivityLog[]
  activeCollaborators: UserPresence[]
  lastModified: string
  modifiedBy: string
}

// Tipos para API responses
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Tipos para upload
export interface UploadProgress {
  fileName: string
  progressPercent: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  errorMessage?: string
}

export interface PPTXUploadResult {
  projectId: string
  slidesCreated: number
  processingTime: number
  warnings: string[]
}

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalViews: number
  most_used_templates: Array<{ name: string; count: number }>
  average_completion_time: number
  total_duration: number
  by_status: Record<string, number>
  by_category: Record<string, number>
}

export interface ExportOptions {
  format: 'mp4' | 'webm' | 'avi'
  quality: 'low' | 'medium' | 'high' | 'ultra'
  resolution: '720p' | '1080p' | '4k'
  fps: 24 | 30 | 60
  includeAudio: boolean
}

export interface ExportJob {
  id: string
  projectId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  options: ExportOptions
  outputUrl?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
}