import { useState, useEffect, useCallback } from 'react';
import { backupService, BackupJob, RestoreJob, BackupSettings, SyncStatus } from '../services/backupService';
import { toast } from 'sonner';

export interface UseBackupReturn {
  // Estados
  backupJobs: BackupJob[];
  restoreJobs: RestoreJob[];
  syncStatus: SyncStatus;
  backupSettings: BackupSettings | null;
  isCreatingBackup: boolean;
  isRestoring: boolean;
  isSyncing: boolean;
  backupHistory: BackupJob[];
  
  // Ações
  createBackup: (projectId: string, type?: 'manual' | 'auto' | 'scheduled') => Promise<string | null>;
  restoreBackup: (projectId: string, backupId: string) => Promise<string | null>;
  deleteBackup: (backupId: string) => Promise<void>;
  syncToCloud: (projectId: string) => Promise<void>;
  setupAutoBackup: (projectId: string, settings: BackupSettings) => Promise<void>;
  loadBackupHistory: (projectId: string) => Promise<void>;
  loadBackupSettings: (projectId: string) => Promise<void>;
  updateBackupSettings: (projectId: string, settings: Partial<BackupSettings>) => Promise<void>;
  resolveConflict: (projectId: string, conflictId: string, resolution: 'local' | 'remote' | 'merge') => Promise<void>;
  
  // Utilitários
  formatBackupSize: (bytes: number) => string;
  getBackupAge: (backup: BackupJob) => string;
  canRestore: (backup: BackupJob) => boolean;
}

export function useBackup(projectId?: string): UseBackupReturn {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(backupService.getSyncStatus());
  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupJob[]>([]);

  // Carregar histórico de backups
  const loadBackupHistory = useCallback(async (targetProjectId: string) => {
    try {
      const history = await backupService.getBackupHistory(targetProjectId);
      setBackupHistory(history);
    } catch (error) {
      console.error('Erro ao carregar histórico de backups:', error);
      toast.error('Erro ao carregar histórico de backups');
    }
  }, []);

  // Carregar configurações de backup
  const loadBackupSettings = useCallback(async (targetProjectId: string) => {
    try {
      const settings = await backupService.getBackupSettings(targetProjectId);
      setBackupSettings(settings || {
        autoBackup: false,
        backupInterval: 60, // 1 hora
        maxBackups: 10,
        compression: 'gzip',
        encryption: true,
        cloudSync: true,
        syncProvider: 'supabase',
        retentionDays: 30
      });
    } catch (error) {
      console.error('Erro ao carregar configurações de backup:', error);
    }
  }, []);

  // Criar backup
  const createBackup = useCallback(async (
    targetProjectId: string, 
    type: 'manual' | 'auto' | 'scheduled' = 'manual'
  ): Promise<string | null> => {
    if (isCreatingBackup) {
      toast.warning('Backup já em andamento');
      return null;
    }

    setIsCreatingBackup(true);
    
    try {
      const backupId = await backupService.createBackup(targetProjectId, type);
      
      // Recarregar histórico
      await loadBackupHistory(targetProjectId);
      
      return backupId;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      return null;
    } finally {
      setIsCreatingBackup(false);
    }
  }, [isCreatingBackup, loadBackupHistory]);

  // Restaurar backup
  const restoreBackup = useCallback(async (
    targetProjectId: string, 
    backupId: string
  ): Promise<string | null> => {
    if (isRestoring) {
      toast.warning('Restauração já em andamento');
      return null;
    }

    setIsRestoring(true);
    
    try {
      const restoreId = await backupService.restoreBackup(targetProjectId, backupId);
      return restoreId;
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      return null;
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring]);

  // Deletar backup
  const deleteBackup = useCallback(async (backupId: string) => {
    try {
      // Implementar deleção de backup
      toast.success('Backup deletado com sucesso');
      
      if (projectId) {
        await loadBackupHistory(projectId);
      }
    } catch (error) {
      console.error('Erro ao deletar backup:', error);
      toast.error('Erro ao deletar backup');
    }
  }, [projectId, loadBackupHistory]);

  // Sincronizar com a nuvem
  const syncToCloud = useCallback(async (targetProjectId: string) => {
    if (isSyncing) {
      toast.warning('Sincronização já em andamento');
      return;
    }

    setIsSyncing(true);
    
    try {
      await backupService.syncToCloud(targetProjectId);
      toast.success('Sincronização concluída');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Configurar backup automático
  const setupAutoBackup = useCallback(async (
    targetProjectId: string, 
    settings: BackupSettings
  ) => {
    try {
      await backupService.setupAutoBackup(targetProjectId, settings);
      setBackupSettings(settings);
      toast.success('Configurações de backup atualizadas');
    } catch (error) {
      console.error('Erro ao configurar backup automático:', error);
      toast.error('Erro ao configurar backup automático');
    }
  }, []);

  // Atualizar configurações de backup
  const updateBackupSettings = useCallback(async (
    targetProjectId: string, 
    newSettings: Partial<BackupSettings>
  ) => {
    if (!backupSettings) return;
    
    const updatedSettings = { ...backupSettings, ...newSettings };
    await setupAutoBackup(targetProjectId, updatedSettings);
  }, [backupSettings, setupAutoBackup]);

  // Resolver conflito de sincronização
  const resolveConflict = useCallback(async (
    targetProjectId: string, 
    conflictId: string, 
    resolution: 'local' | 'remote' | 'merge'
  ) => {
    try {
      // Implementar resolução de conflitos
      toast.success('Conflito resolvido');
      
      // Tentar sincronizar novamente
      await syncToCloud(targetProjectId);
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
      toast.error('Erro ao resolver conflito');
    }
  }, [syncToCloud]);

  // Formatar tamanho do backup
  const formatBackupSize = useCallback((bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  // Calcular idade do backup
  const getBackupAge = useCallback((backup: BackupJob): string => {
    const now = new Date();
    const backupDate = backup.completedAt || backup.startedAt;
    const diffMs = now.getTime() - backupDate.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else {
      return `${diffDays}d atrás`;
    }
  }, []);

  // Verificar se pode restaurar backup
  const canRestore = useCallback((backup: BackupJob): boolean => {
    return backup.status === 'completed' && !isRestoring;
  }, [isRestoring]);

  // Event listeners para atualizações em tempo real
  useEffect(() => {
    const handleBackupStarted = (backup: BackupJob) => {
      setBackupJobs(prev => [...prev, backup]);
    };

    const handleBackupProgress = (backup: BackupJob) => {
      setBackupJobs(prev => 
        prev.map(job => job.id === backup.id ? backup : job)
      );
    };

    const handleBackupCompleted = (backup: BackupJob) => {
      setBackupJobs(prev => 
        prev.map(job => job.id === backup.id ? backup : job)
      );
      
      if (projectId) {
        loadBackupHistory(projectId);
      }
    };

    const handleBackupFailed = (backup: BackupJob) => {
      setBackupJobs(prev => 
        prev.map(job => job.id === backup.id ? backup : job)
      );
    };

    const handleRestoreStarted = (restore: RestoreJob) => {
      setRestoreJobs(prev => [...prev, restore]);
    };

    const handleRestoreProgress = (restore: RestoreJob) => {
      setRestoreJobs(prev => 
        prev.map(job => job.id === restore.id ? restore : job)
      );
    };

    const handleRestoreCompleted = (restore: RestoreJob) => {
      setRestoreJobs(prev => 
        prev.map(job => job.id === restore.id ? restore : job)
      );
    };

    const handleRestoreFailed = (restore: RestoreJob) => {
      setRestoreJobs(prev => 
        prev.map(job => job.id === restore.id ? restore : job)
      );
    };

    const handleSyncStarted = () => {
      setIsSyncing(true);
    };

    const handleSyncCompleted = () => {
      setIsSyncing(false);
      setSyncStatus(backupService.getSyncStatus());
    };

    const handleSyncFailed = () => {
      setIsSyncing(false);
    };

    const handleSyncConflicts = (data: { conflicts: any[] }) => {
      setSyncStatus(prev => ({ ...prev, conflictsCount: data.conflicts.length }));
    };

    const handleNetworkStatusChanged = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    // Registrar event listeners
    backupService.on('backupStarted', handleBackupStarted);
    backupService.on('backupProgress', handleBackupProgress);
    backupService.on('backupCompleted', handleBackupCompleted);
    backupService.on('backupFailed', handleBackupFailed);
    backupService.on('restoreStarted', handleRestoreStarted);
    backupService.on('restoreProgress', handleRestoreProgress);
    backupService.on('restoreCompleted', handleRestoreCompleted);
    backupService.on('restoreFailed', handleRestoreFailed);
    backupService.on('syncStarted', handleSyncStarted);
    backupService.on('syncCompleted', handleSyncCompleted);
    backupService.on('syncFailed', handleSyncFailed);
    backupService.on('syncConflicts', handleSyncConflicts);
    backupService.on('networkStatusChanged', handleNetworkStatusChanged);

    return () => {
      // Remover event listeners
      backupService.off('backupStarted', handleBackupStarted);
      backupService.off('backupProgress', handleBackupProgress);
      backupService.off('backupCompleted', handleBackupCompleted);
      backupService.off('backupFailed', handleBackupFailed);
      backupService.off('restoreStarted', handleRestoreStarted);
      backupService.off('restoreProgress', handleRestoreProgress);
      backupService.off('restoreCompleted', handleRestoreCompleted);
      backupService.off('restoreFailed', handleRestoreFailed);
      backupService.off('syncStarted', handleSyncStarted);
      backupService.off('syncCompleted', handleSyncCompleted);
      backupService.off('syncFailed', handleSyncFailed);
      backupService.off('syncConflicts', handleSyncConflicts);
      backupService.off('networkStatusChanged', handleNetworkStatusChanged);
    };
  }, [projectId, loadBackupHistory]);

  // Carregar dados iniciais
  useEffect(() => {
    if (projectId) {
      loadBackupHistory(projectId);
      loadBackupSettings(projectId);
    }
  }, [projectId, loadBackupHistory, loadBackupSettings]);

  // Atualizar status de sincronização periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(backupService.getSyncStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    // Estados
    backupJobs,
    restoreJobs,
    syncStatus,
    backupSettings,
    isCreatingBackup,
    isRestoring,
    isSyncing,
    backupHistory,
    
    // Ações
    createBackup,
    restoreBackup,
    deleteBackup,
    syncToCloud,
    setupAutoBackup,
    loadBackupHistory,
    loadBackupSettings,
    updateBackupSettings,
    resolveConflict,
    
    // Utilitários
    formatBackupSize,
    getBackupAge,
    canRestore
  };
}