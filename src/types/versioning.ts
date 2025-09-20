export interface ProjectVersionAdvanced {
  id: string
  projectId: string
  versionNumber: string // ex: "1.0.0", "1.1.0", "2.0.0-beta.1"
  title: string
  description?: string
  changesSummary: string
  changeLog: VersionChange[]
  branchName?: string
  parentVersionId?: string
  mergeCommitId?: string
  tags: string[]
  status: 'draft' | 'published' | 'archived' | 'deprecated'
  visibility: 'private' | 'team' | 'public'
  createdBy: string
  createdAt: string
  publishedAt?: string
  archivedAt?: string
  metadata: VersionMetadata
  backupData: ProjectSnapshot
  checksums: VersionChecksums
}

export interface VersionChange {
  id: string
  type: 'create' | 'update' | 'delete' | 'move' | 'rename'
  target: 'project' | 'layer' | 'asset' | 'setting' | 'metadata'
  targetId?: string
  path: string // caminho do objeto alterado
  before?: any
  after?: any
  description: string
  impact: 'minor' | 'major' | 'breaking'
  timestamp: string
}

export interface VersionMetadata {
  fileSize: number
  layerCount: number
  assetCount: number
  duration: number
  resolution: string
  fps: number
  audioTracks: number
  effectsUsed: string[]
  templatesUsed: string[]
  aiFeatures: string[]
  performance: {
    renderTime?: number
    exportTime?: number
    fileSize: number
  }
}

export interface ProjectSnapshot {
  project: any // dados completos do projeto
  layers: any[] // todas as camadas
  assets: any[] // todos os assets
  settings: any // configurações
  metadata: any // metadados
  timestamp: string
  compression: 'none' | 'gzip' | 'lz4'
  encrypted: boolean
}

export interface VersionChecksums {
  project: string
  layers: string
  assets: string
  settings: string
  metadata: string
  full: string // checksum de todo o snapshot
  algorithm: 'md5' | 'sha256' | 'sha512'
}

// Sistema de branches
export interface ProjectBranch {
  id: string
  projectId: string
  name: string
  description?: string
  type: 'main' | 'feature' | 'hotfix' | 'release' | 'experimental'
  parentBranchId?: string
  headVersionId: string
  status: 'active' | 'merged' | 'abandoned' | 'protected'
  createdBy: string
  createdAt: string
  updatedAt: string
  mergedAt?: string
  mergedBy?: string
  mergedInto?: string
  protection: BranchProtection
}

export interface BranchProtection {
  enabled: boolean
  requireReview: boolean
  requiredReviewers: number
  allowForcePush: boolean
  allowDeletion: boolean
  restrictedUsers?: string[]
  allowedUsers?: string[]
}

// Sistema de merge
export interface MergeRequest {
  id: string
  projectId: string
  sourceBranchId: string
  targetBranchId: string
  sourceVersionId: string
  targetVersionId: string
  title: string
  description?: string
  status: 'open' | 'merged' | 'closed' | 'draft'
  conflicts: MergeConflict[]
  reviews: MergeReview[]
  createdBy: string
  createdAt: string
  updatedAt: string
  mergedAt?: string
  mergedBy?: string
  closedAt?: string
  closedBy?: string
}

export interface MergeConflict {
  id: string
  mergeRequestId: string
  type: 'content' | 'structure' | 'metadata' | 'settings'
  path: string
  description: string
  sourceValue: any
  targetValue: any
  resolution?: any
  status: 'pending' | 'resolved' | 'ignored'
  resolvedBy?: string
  resolvedAt?: string
}

export interface MergeReview {
  id: string
  mergeRequestId: string
  reviewerId: string
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  comment?: string
  changes: ReviewChange[]
  createdAt: string
  updatedAt: string
}

export interface ReviewChange {
  id: string
  reviewId: string
  type: 'suggestion' | 'issue' | 'approval' | 'question'
  path: string
  lineNumber?: number
  content: string
  suggestion?: any
  status: 'open' | 'resolved' | 'ignored'
  resolvedBy?: string
  resolvedAt?: string
}

// Comparação de versões
export interface VersionComparison {
  sourceVersionId: string
  targetVersionId: string
  differences: VersionDifference[]
  summary: ComparisonSummary
  generatedAt: string
}

export interface VersionDifference {
  type: 'added' | 'removed' | 'modified' | 'moved' | 'renamed'
  category: 'project' | 'layer' | 'asset' | 'setting' | 'metadata'
  path: string
  before?: any
  after?: any
  impact: 'visual' | 'functional' | 'performance' | 'metadata'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ComparisonSummary {
  totalChanges: number
  addedItems: number
  removedItems: number
  modifiedItems: number
  movedItems: number
  renamedItems: number
  impactAnalysis: {
    visual: number
    functional: number
    performance: number
    metadata: number
  }
  compatibilityScore: number // 0-100
  migrationRequired: boolean
}

// Backup e restauração
export interface BackupJob {
  id: string
  projectId: string
  versionId?: string
  type: 'manual' | 'automatic' | 'scheduled'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  backupLocation: string
  backupSize: number
  compression: 'none' | 'gzip' | 'lz4'
  encryption: boolean
  retentionDays: number
  createdBy?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  failedAt?: string
  errorMessage?: string
  metadata: BackupMetadata
}

export interface BackupMetadata {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  fileCount: number
  checksums: VersionChecksums
  dependencies: string[] // IDs de assets externos
  environment: {
    version: string
    platform: string
    features: string[]
  }
}

export interface RestoreJob {
  id: string
  projectId: string
  backupJobId: string
  targetVersionId?: string
  type: 'full' | 'partial' | 'selective'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  options: RestoreOptions
  conflicts: RestoreConflict[]
  createdBy: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  failedAt?: string
  errorMessage?: string
}

export interface RestoreOptions {
  overwriteExisting: boolean
  createNewVersion: boolean
  restoreAssets: boolean
  restoreSettings: boolean
  restoreMetadata: boolean
  selectedLayers?: string[]
  selectedAssets?: string[]
  conflictResolution: 'skip' | 'overwrite' | 'merge' | 'prompt'
}

export interface RestoreConflict {
  id: string
  restoreJobId: string
  type: 'file_exists' | 'version_mismatch' | 'dependency_missing' | 'permission_denied'
  path: string
  description: string
  currentValue?: any
  backupValue?: any
  resolution?: 'skip' | 'overwrite' | 'merge' | 'manual'
  resolvedBy?: string
  resolvedAt?: string
}

// Histórico e auditoria
export interface VersionHistory {
  projectId: string
  versions: ProjectVersionAdvanced[]
  branches: ProjectBranch[]
  mergeRequests: MergeRequest[]
  timeline: HistoryEvent[]
  statistics: HistoryStatistics
}

export interface HistoryEvent {
  id: string
  projectId: string
  type: 'version_created' | 'version_published' | 'branch_created' | 'branch_merged' | 'backup_created' | 'restore_completed'
  description: string
  userId: string
  metadata: any
  timestamp: string
}

export interface HistoryStatistics {
  totalVersions: number
  totalBranches: number
  totalMerges: number
  totalBackups: number
  averageVersionSize: number
  mostActiveContributors: {
    userId: string
    versions: number
    branches: number
    merges: number
  }[]
  versionFrequency: {
    period: string
    count: number
  }[]
}

// Configurações de versionamento
export interface VersioningSettings {
  projectId: string
  autoVersioning: {
    enabled: boolean
    trigger: 'time' | 'changes' | 'manual'
    interval?: number // em minutos
    changeThreshold?: number // número de mudanças
  }
  autoBackup: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    retentionDays: number
    compression: 'none' | 'gzip' | 'lz4'
    encryption: boolean
  }
  branchProtection: {
    protectMain: boolean
    requireReview: boolean
    requiredReviewers: number
    allowForcePush: boolean
  }
  notifications: {
    onVersionCreated: boolean
    onBranchCreated: boolean
    onMergeRequest: boolean
    onConflict: boolean
    onBackupCompleted: boolean
  }
  cleanup: {
    autoCleanup: boolean
    keepVersions: number
    keepDays: number
    cleanupDrafts: boolean
  }
}

// Tipos para exportação de histórico
export interface VersionExport {
  format: 'json' | 'xml' | 'csv' | 'pdf'
  includeSnapshots: boolean
  includeAssets: boolean
  compression: 'none' | 'zip' | 'tar.gz'
  dateRange?: {
    start: string
    end: string
  }
  versions?: string[]
  branches?: string[]
}

export interface VersionImport {
  source: 'file' | 'url' | 'project'
  format: 'json' | 'xml' | 'zip'
  options: {
    createNewProject: boolean
    mergeWithExisting: boolean
    conflictResolution: 'skip' | 'overwrite' | 'merge'
    importAssets: boolean
    importSettings: boolean
  }
  mapping?: {
    [key: string]: string // mapeamento de IDs antigos para novos
  }
}