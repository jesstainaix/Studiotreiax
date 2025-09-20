import { supabase } from '@/lib/supabase'
import type {
  ProjectVersionAdvanced,
  VersionChange,
  ProjectBranch,
  MergeRequest,
  VersionComparison,
  BackupJob,
  RestoreJob,
  VersionHistory,
  VersioningSettings
} from '@/types/versioning'
import type { Project } from '@/types/project'

class VersioningService {
  private settings: VersioningSettings = {
    autoSave: true,
    autoSaveInterval: 300, // 5 minutos
    maxVersions: 50,
    compressionEnabled: true,
    backupEnabled: true,
    backupInterval: 3600, // 1 hora
    retentionDays: 30,
    conflictResolution: 'manual'
  }

  // Gerenciamento de versões
  async createVersion(
    projectId: string,
    description: string,
    changes: VersionChange[],
    isAutoSave: boolean = false
  ): Promise<ProjectVersionAdvanced> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Obter a versão atual do projeto
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (!project) throw new Error('Projeto não encontrado')

    // Obter o número da próxima versão
    const { data: lastVersion } = await supabase
      .from('project_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = (lastVersion?.version_number || 0) + 1

    // Criar snapshot do estado atual
    const snapshot = await this.createSnapshot(project)

    // Calcular diferenças
    const diff = await this.calculateDiff(projectId, snapshot)

    const { data: version, error } = await supabase
      .from('project_versions')
      .insert({
        project_id: projectId,
        version_number: nextVersionNumber,
        description,
        created_by: user.id,
        changes,
        snapshot,
        diff,
        is_auto_save: isAutoSave,
        file_size: JSON.stringify(snapshot).length,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Limpar versões antigas se necessário
    await this.cleanupOldVersions(projectId)

    return this.mapVersionFromDB(version)
  }

  async getVersionHistory(
    projectId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<VersionHistory> {
    const { data: versions, error } = await supabase
      .from('project_versions')
      .select(`
        *,
        creator:profiles!created_by(id, name, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const { count } = await supabase
      .from('project_versions')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    return {
      versions: versions.map(v => this.mapVersionFromDB(v)),
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    }
  }

  async getVersion(versionId: string): Promise<ProjectVersionAdvanced | null> {
    const { data: version, error } = await supabase
      .from('project_versions')
      .select(`
        *,
        creator:profiles!created_by(id, name, avatar_url)
      `)
      .eq('id', versionId)
      .single()

    if (error) return null
    return this.mapVersionFromDB(version)
  }

  async restoreVersion(versionId: string): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const version = await this.getVersion(versionId)
    if (!version) throw new Error('Versão não encontrada')

    // Criar uma nova versão antes de restaurar
    await this.createVersion(
      version.projectId,
      `Backup antes de restaurar versão ${version.versionNumber}`,
      [],
      true
    )

    // Restaurar o projeto com o snapshot da versão
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...version.snapshot,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', version.projectId)
      .select()
      .single()

    if (error) throw error

    // Registrar a restauração
    await this.createVersion(
      version.projectId,
      `Restaurado da versão ${version.versionNumber}`,
      [{
        type: 'restore',
        path: 'project',
        before: null,
        after: version.snapshot,
        timestamp: new Date().toISOString()
      }]
    )

    return project
  }

  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<VersionComparison> {
    const [version1, version2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2)
    ])

    if (!version1 || !version2) {
      throw new Error('Uma ou ambas as versões não foram encontradas')
    }

    const differences = this.calculateDifferences(version1.snapshot, version2.snapshot)
    const statistics = this.calculateComparisonStats(differences)

    return {
      version1,
      version2,
      differences,
      statistics,
      createdAt: new Date().toISOString()
    }
  }

  // Gerenciamento de branches
  async createBranch(
    projectId: string,
    name: string,
    description: string,
    sourceVersionId?: string
  ): Promise<ProjectBranch> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Verificar se o nome da branch já existe
    const { data: existingBranch } = await supabase
      .from('project_branches')
      .select('id')
      .eq('project_id', projectId)
      .eq('name', name)
      .single()

    if (existingBranch) {
      throw new Error('Já existe uma branch com este nome')
    }

    const { data: branch, error } = await supabase
      .from('project_branches')
      .insert({
        project_id: projectId,
        name,
        description,
        created_by: user.id,
        source_version_id: sourceVersionId,
        is_main: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return this.mapBranchFromDB(branch)
  }

  async getBranches(projectId: string): Promise<ProjectBranch[]> {
    const { data: branches, error } = await supabase
      .from('project_branches')
      .select(`
        *,
        creator:profiles!created_by(id, name, avatar_url),
        versions:project_versions(count)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return branches.map(b => this.mapBranchFromDB(b))
  }

  async mergeBranch(
    sourceBranchId: string,
    targetBranchId: string,
    strategy: 'fast-forward' | 'merge-commit' | 'squash' = 'merge-commit'
  ): Promise<MergeRequest> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const [sourceBranch, targetBranch] = await Promise.all([
      this.getBranch(sourceBranchId),
      this.getBranch(targetBranchId)
    ])

    if (!sourceBranch || !targetBranch) {
      throw new Error('Branch não encontrada')
    }

    // Verificar conflitos
    const conflicts = await this.detectMergeConflicts(sourceBranchId, targetBranchId)

    const { data: mergeRequest, error } = await supabase
      .from('merge_requests')
      .insert({
        source_branch_id: sourceBranchId,
        target_branch_id: targetBranchId,
        created_by: user.id,
        strategy,
        status: conflicts.length > 0 ? 'conflicts' : 'ready',
        conflicts,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return this.mapMergeRequestFromDB(mergeRequest)
  }

  // Backup e restauração
  async createBackup(
    projectId: string,
    type: 'manual' | 'automatic' = 'manual',
    description?: string
  ): Promise<BackupJob> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (!project) throw new Error('Projeto não encontrado')

    // Criar snapshot completo
    const snapshot = await this.createFullSnapshot(project)
    const compressedData = this.settings.compressionEnabled 
      ? await this.compressData(snapshot)
      : snapshot

    const { data: backup, error } = await supabase
      .from('project_backups')
      .insert({
        project_id: projectId,
        type,
        description: description || `Backup ${type} - ${new Date().toLocaleString()}`,
        data: compressedData,
        file_size: JSON.stringify(compressedData).length,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return this.mapBackupFromDB(backup)
  }

  async getBackups(
    projectId: string,
    limit: number = 10
  ): Promise<BackupJob[]> {
    const { data: backups, error } = await supabase
      .from('project_backups')
      .select(`
        *,
        creator:profiles!created_by(id, name, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return backups.map(b => this.mapBackupFromDB(b))
  }

  async restoreFromBackup(backupId: string): Promise<RestoreJob> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: backup, error: backupError } = await supabase
      .from('project_backups')
      .select('*')
      .eq('id', backupId)
      .single()

    if (backupError || !backup) {
      throw new Error('Backup não encontrado')
    }

    // Criar backup do estado atual antes de restaurar
    await this.createBackup(
      backup.project_id,
      'automatic',
      'Backup automático antes da restauração'
    )

    // Descomprimir dados se necessário
    const restoredData = this.settings.compressionEnabled
      ? await this.decompressData(backup.data)
      : backup.data

    // Restaurar projeto
    const { error: restoreError } = await supabase
      .from('projects')
      .update({
        ...restoredData,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', backup.project_id)

    if (restoreError) throw restoreError

    // Registrar a restauração
    const { data: restoreJob, error } = await supabase
      .from('restore_jobs')
      .insert({
        backup_id: backupId,
        project_id: backup.project_id,
        restored_by: user.id,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return this.mapRestoreJobFromDB(restoreJob)
  }

  // Configurações
  async updateSettings(settings: Partial<VersioningSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings }
    
    // Salvar no localStorage ou banco de dados
    localStorage.setItem('versioningSettings', JSON.stringify(this.settings))
  }

  getSettings(): VersioningSettings {
    return { ...this.settings }
  }

  // Métodos auxiliares privados
  private async createSnapshot(project: any): Promise<any> {
    // Criar snapshot completo do projeto
    return {
      ...project,
      timestamp: new Date().toISOString()
    }
  }

  private async createFullSnapshot(project: any): Promise<any> {
    // Incluir dados relacionados como layers, effects, etc.
    const { data: layers } = await supabase
      .from('project_layers')
      .select('*')
      .eq('project_id', project.id)

    return {
      project,
      layers: layers || [],
      timestamp: new Date().toISOString()
    }
  }

  private async calculateDiff(projectId: string, currentSnapshot: any): Promise<any> {
    const { data: lastVersion } = await supabase
      .from('project_versions')
      .select('snapshot')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastVersion) return null

    return this.calculateDifferences(lastVersion.snapshot, currentSnapshot)
  }

  private calculateDifferences(obj1: any, obj2: any): any[] {
    const differences: any[] = []
    
    // Implementação simplificada de diff
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])
    
    keys.forEach(key => {
      const val1 = obj1?.[key]
      const val2 = obj2?.[key]
      
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({
          path: key,
          type: !val1 ? 'added' : !val2 ? 'removed' : 'modified',
          before: val1,
          after: val2
        })
      }
    })
    
    return differences
  }

  private calculateComparisonStats(differences: any[]): any {
    return {
      totalChanges: differences.length,
      additions: differences.filter(d => d.type === 'added').length,
      deletions: differences.filter(d => d.type === 'removed').length,
      modifications: differences.filter(d => d.type === 'modified').length
    }
  }

  private async cleanupOldVersions(projectId: string): Promise<void> {
    if (!this.settings.maxVersions) return

    const { data: versions } = await supabase
      .from('project_versions')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_auto_save', true)
      .order('created_at', { ascending: false })
      .range(this.settings.maxVersions, 1000)

    if (versions && versions.length > 0) {
      const idsToDelete = versions.map(v => v.id)
      await supabase
        .from('project_versions')
        .delete()
        .in('id', idsToDelete)
    }
  }

  private async getBranch(branchId: string): Promise<ProjectBranch | null> {
    const { data: branch, error } = await supabase
      .from('project_branches')
      .select('*')
      .eq('id', branchId)
      .single()

    if (error) return null
    return this.mapBranchFromDB(branch)
  }

  private async detectMergeConflicts(sourceBranchId: string, targetBranchId: string): Promise<any[]> {
    // Implementação simplificada de detecção de conflitos
    return []
  }

  private async compressData(data: any): Promise<any> {
    // Implementação de compressão (pode usar bibliotecas como pako)
    return data
  }

  private async decompressData(data: any): Promise<any> {
    // Implementação de descompressão
    return data
  }

  // Mapeamento de dados
  private mapVersionFromDB(data: any): ProjectVersionAdvanced {
    return {
      id: data.id,
      projectId: data.project_id,
      versionNumber: data.version_number,
      description: data.description,
      createdBy: data.created_by,
      createdAt: data.created_at,
      changes: data.changes || [],
      snapshot: data.snapshot,
      diff: data.diff,
      isAutoSave: data.is_auto_save,
      fileSize: data.file_size,
      tags: data.tags || [],
      creator: data.creator
    }
  }

  private mapBranchFromDB(data: any): ProjectBranch {
    return {
      id: data.id,
      projectId: data.project_id,
      name: data.name,
      description: data.description,
      createdBy: data.created_by,
      createdAt: data.created_at,
      sourceVersionId: data.source_version_id,
      isMain: data.is_main,
      isActive: data.is_active,
      lastCommit: data.last_commit,
      versionsCount: data.versions?.[0]?.count || 0
    }
  }

  private mapMergeRequestFromDB(data: any): MergeRequest {
    return {
      id: data.id,
      sourceBranchId: data.source_branch_id,
      targetBranchId: data.target_branch_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
      strategy: data.strategy,
      status: data.status,
      conflicts: data.conflicts || [],
      resolvedAt: data.resolved_at,
      resolvedBy: data.resolved_by
    }
  }

  private mapBackupFromDB(data: any): BackupJob {
    return {
      id: data.id,
      projectId: data.project_id,
      type: data.type,
      description: data.description,
      fileSize: data.file_size,
      createdBy: data.created_by,
      createdAt: data.created_at,
      status: 'completed'
    }
  }

  private mapRestoreJobFromDB(data: any): RestoreJob {
    return {
      id: data.id,
      backupId: data.backup_id,
      projectId: data.project_id,
      restoredBy: data.restored_by,
      status: data.status,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      error: data.error
    }
  }
}

export const versioningService = new VersioningService()
export default versioningService