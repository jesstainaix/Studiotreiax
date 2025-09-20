import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { versioningService } from '@/services/versioningService'
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

interface UseVersioningOptions {
  projectId: string
  autoSave?: boolean
  autoSaveInterval?: number
  enableNotifications?: boolean
}

interface UseVersioningReturn {
  // Estado das versões
  versions: ProjectVersionAdvanced[]
  currentVersion: ProjectVersionAdvanced | null
  versionHistory: VersionHistory | null
  
  // Estado dos branches
  branches: ProjectBranch[]
  currentBranch: ProjectBranch | null
  
  // Estado dos backups
  backups: BackupJob[]
  
  // Configurações
  settings: VersioningSettings
  
  // Ações de versionamento
  createVersion: (description: string, changes?: VersionChange[]) => Promise<ProjectVersionAdvanced>
  restoreVersion: (versionId: string) => Promise<Project>
  compareVersions: (versionId1: string, versionId2: string) => Promise<VersionComparison>
  deleteVersion: (versionId: string) => Promise<void>
  
  // Ações de branches
  createBranch: (name: string, description: string, sourceVersionId?: string) => Promise<ProjectBranch>
  switchBranch: (branchId: string) => Promise<void>
  mergeBranch: (sourceBranchId: string, targetBranchId: string, strategy?: string) => Promise<MergeRequest>
  deleteBranch: (branchId: string) => Promise<void>
  
  // Ações de backup
  createBackup: (description?: string) => Promise<BackupJob>
  restoreFromBackup: (backupId: string) => Promise<RestoreJob>
  deleteBackup: (backupId: string) => Promise<void>
  
  // Configurações
  updateSettings: (settings: Partial<VersioningSettings>) => Promise<void>
  
  // Utilitários
  loadVersionHistory: (limit?: number, offset?: number) => Promise<void>
  loadBranches: () => Promise<void>
  loadBackups: (limit?: number) => Promise<void>
  
  // Auto-save
  enableAutoSave: () => void
  disableAutoSave: () => void
  triggerAutoSave: () => Promise<void>
  
  // Estado de carregamento e erro
  loading: boolean
  error: string | null
  
  // Indicadores de estado
  hasUnsavedChanges: boolean
  isAutoSaveEnabled: boolean
  lastAutoSave: Date | null
}

export function useVersioning({
  projectId,
  autoSave = true,
  autoSaveInterval = 300000, // 5 minutos
  enableNotifications = true
}: UseVersioningOptions): UseVersioningReturn {
  const [versions, setVersions] = useState<ProjectVersionAdvanced[]>([])
  const [currentVersion, setCurrentVersion] = useState<ProjectVersionAdvanced | null>(null)
  const [versionHistory, setVersionHistory] = useState<VersionHistory | null>(null)
  const [branches, setBranches] = useState<ProjectBranch[]>([])
  const [currentBranch, setCurrentBranch] = useState<ProjectBranch | null>(null)
  const [backups, setBackups] = useState<BackupJob[]>([])
  const [settings, setSettings] = useState<VersioningSettings>(versioningService.getSettings())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(autoSave)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>()
  const changeTrackingRef = useRef<VersionChange[]>([])
  const lastSnapshotRef = useRef<any>(null)

  // Carregar dados iniciais
  useEffect(() => {
    if (projectId) {
      loadVersionHistory()
      loadBranches()
      loadBackups()
    }
  }, [projectId])

  // Configurar auto-save
  useEffect(() => {
    if (isAutoSaveEnabled && projectId) {
      enableAutoSave()
    } else {
      disableAutoSave()
    }
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [isAutoSaveEnabled, projectId, autoSaveInterval])

  // Criar nova versão
  const createVersion = useCallback(async (
    description: string,
    changes: VersionChange[] = []
  ): Promise<ProjectVersionAdvanced> => {
    try {
      setLoading(true)
      setError(null)
      
      const allChanges = [...changeTrackingRef.current, ...changes]
      const version = await versioningService.createVersion(
        projectId,
        description,
        allChanges
      )
      
      setVersions(prev => [version, ...prev])
      setCurrentVersion(version)
      
      // Limpar mudanças rastreadas
      changeTrackingRef.current = []
      setHasUnsavedChanges(false)
      
      if (enableNotifications) {
        toast.success(`Versão ${version.versionNumber} criada`)
      }
      
      return version
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar versão'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [projectId, enableNotifications])

  // Restaurar versão
  const restoreVersion = useCallback(async (versionId: string): Promise<Project> => {
    try {
      setLoading(true)
      setError(null)
      
      const project = await versioningService.restoreVersion(versionId)
      
      // Atualizar estado local
      await loadVersionHistory()
      
      if (enableNotifications) {
        toast.success('Versão restaurada com sucesso')
      }
      
      return project
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao restaurar versão'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [enableNotifications])

  // Comparar versões
  const compareVersions = useCallback(async (
    versionId1: string,
    versionId2: string
  ): Promise<VersionComparison> => {
    try {
      setLoading(true)
      setError(null)
      
      const comparison = await versioningService.compareVersions(versionId1, versionId2)
      
      return comparison
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao comparar versões'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Deletar versão
  const deleteVersion = useCallback(async (versionId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      // Implementar deleção no service
      // await versioningService.deleteVersion(versionId)
      
      setVersions(prev => prev.filter(v => v.id !== versionId))
      
      if (enableNotifications) {
        toast.success('Versão removida')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover versão'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [enableNotifications])

  // Criar branch
  const createBranch = useCallback(async (
    name: string,
    description: string,
    sourceVersionId?: string
  ): Promise<ProjectBranch> => {
    try {
      setLoading(true)
      setError(null)
      
      const branch = await versioningService.createBranch(
        projectId,
        name,
        description,
        sourceVersionId
      )
      
      setBranches(prev => [branch, ...prev])
      
      if (enableNotifications) {
        toast.success(`Branch '${name}' criada`)
      }
      
      return branch
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar branch'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [projectId, enableNotifications])

  // Trocar branch
  const switchBranch = useCallback(async (branchId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      // Implementar troca de branch
      const branch = branches.find(b => b.id === branchId)
      if (branch) {
        setCurrentBranch(branch)
        
        if (enableNotifications) {
          toast.success(`Trocado para branch '${branch.name}'`)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao trocar branch'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [branches, enableNotifications])

  // Fazer merge de branch
  const mergeBranch = useCallback(async (
    sourceBranchId: string,
    targetBranchId: string,
    strategy: string = 'merge-commit'
  ): Promise<MergeRequest> => {
    try {
      setLoading(true)
      setError(null)
      
      const mergeRequest = await versioningService.mergeBranch(
        sourceBranchId,
        targetBranchId,
        strategy as any
      )
      
      if (mergeRequest.status === 'conflicts') {
        if (enableNotifications) {
          toast.warning('Conflitos detectados - resolução manual necessária')
        }
      } else {
        if (enableNotifications) {
          toast.success('Merge realizado com sucesso')
        }
      }
      
      return mergeRequest
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer merge'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [enableNotifications])

  // Deletar branch
  const deleteBranch = useCallback(async (branchId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      // Implementar deleção no service
      setBranches(prev => prev.filter(b => b.id !== branchId))
      
      if (enableNotifications) {
        toast.success('Branch removida')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover branch'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [enableNotifications])

  // Criar backup
  const createBackup = useCallback(async (description?: string): Promise<BackupJob> => {
    try {
      setLoading(true)
      setError(null)
      
      const backup = await versioningService.createBackup(
        projectId,
        'manual',
        description
      )
      
      setBackups(prev => [backup, ...prev])
      
      if (enableNotifications) {
        toast.success('Backup criado com sucesso')
      }
      
      return backup
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar backup'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [projectId, enableNotifications])

  // Restaurar do backup
  const restoreFromBackup = useCallback(async (backupId: string): Promise<RestoreJob> => {
    try {
      setLoading(true)
      setError(null)
      
      const restoreJob = await versioningService.restoreFromBackup(backupId)
      
      // Recarregar dados
      await loadVersionHistory()
      
      if (enableNotifications) {
        toast.success('Projeto restaurado do backup')
      }
      
      return restoreJob
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao restaurar backup'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [enableNotifications])

  // Deletar backup
  const deleteBackup = useCallback(async (backupId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      // Implementar deleção no service
      setBackups(prev => prev.filter(b => b.id !== backupId))
      
      if (enableNotifications) {
        toast.success('Backup removido')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover backup'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [enableNotifications])

  // Atualizar configurações
  const updateSettings = useCallback(async (newSettings: Partial<VersioningSettings>): Promise<void> => {
    try {
      await versioningService.updateSettings(newSettings)
      setSettings(versioningService.getSettings())
      
      if (enableNotifications) {
        toast.success('Configurações atualizadas')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar configurações'
      setError(message)
      toast.error(message)
    }
  }, [enableNotifications])

  // Carregar histórico de versões
  const loadVersionHistory = useCallback(async (limit: number = 20, offset: number = 0): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const history = await versioningService.getVersionHistory(projectId, limit, offset)
      setVersionHistory(history)
      setVersions(history.versions)
      
      if (history.versions.length > 0) {
        setCurrentVersion(history.versions[0])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar histórico'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Carregar branches
  const loadBranches = useCallback(async (): Promise<void> => {
    try {
      const branchList = await versioningService.getBranches(projectId)
      setBranches(branchList)
      
      const mainBranch = branchList.find(b => b.isMain)
      if (mainBranch) {
        setCurrentBranch(mainBranch)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar branches'
      setError(message)
    }
  }, [projectId])

  // Carregar backups
  const loadBackups = useCallback(async (limit: number = 10): Promise<void> => {
    try {
      const backupList = await versioningService.getBackups(projectId, limit)
      setBackups(backupList)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar backups'
      setError(message)
    }
  }, [projectId])

  // Habilitar auto-save
  const enableAutoSave = useCallback((): void => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current)
    }
    
    autoSaveIntervalRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        triggerAutoSave()
      }
    }, autoSaveInterval)
    
    setIsAutoSaveEnabled(true)
  }, [hasUnsavedChanges, autoSaveInterval])

  // Desabilitar auto-save
  const disableAutoSave = useCallback((): void => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current)
      autoSaveIntervalRef.current = undefined
    }
    
    setIsAutoSaveEnabled(false)
  }, [])

  // Executar auto-save
  const triggerAutoSave = useCallback(async (): Promise<void> => {
    try {
      if (!hasUnsavedChanges || changeTrackingRef.current.length === 0) {
        return
      }
      
      await createVersion(
        `Auto-save ${new Date().toLocaleString()}`,
        changeTrackingRef.current
      )
      
      setLastAutoSave(new Date())
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }, [hasUnsavedChanges, createVersion])

  // Rastrear mudanças (deve ser chamado quando o projeto é modificado)
  const trackChange = useCallback((change: VersionChange): void => {
    changeTrackingRef.current.push(change)
    setHasUnsavedChanges(true)
  }, [])

  // Limpar mudanças rastreadas
  const clearTrackedChanges = useCallback((): void => {
    changeTrackingRef.current = []
    setHasUnsavedChanges(false)
  }, [])

  return {
    // Estado das versões
    versions,
    currentVersion,
    versionHistory,
    
    // Estado dos branches
    branches,
    currentBranch,
    
    // Estado dos backups
    backups,
    
    // Configurações
    settings,
    
    // Ações de versionamento
    createVersion,
    restoreVersion,
    compareVersions,
    deleteVersion,
    
    // Ações de branches
    createBranch,
    switchBranch,
    mergeBranch,
    deleteBranch,
    
    // Ações de backup
    createBackup,
    restoreFromBackup,
    deleteBackup,
    
    // Configurações
    updateSettings,
    
    // Utilitários
    loadVersionHistory,
    loadBranches,
    loadBackups,
    
    // Auto-save
    enableAutoSave,
    disableAutoSave,
    triggerAutoSave,
    
    // Estado de carregamento e erro
    loading,
    error,
    
    // Indicadores de estado
    hasUnsavedChanges,
    isAutoSaveEnabled,
    lastAutoSave
  }
}

export default useVersioning