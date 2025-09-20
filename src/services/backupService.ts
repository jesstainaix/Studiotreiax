import { supabase } from '../lib/supabase';
import { Project } from '../types/project';
import { toast } from 'sonner';

export interface BackupJob {
  id: string;
  projectId: string;
  type: 'manual' | 'auto' | 'scheduled';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  size: number; // em bytes
  location: string; // URL ou path do backup
  metadata: {
    version: string;
    checksum: string;
    compression: 'none' | 'gzip' | 'brotli';
    encryption: boolean;
  };
  error?: string;
}

export interface RestoreJob {
  id: string;
  projectId: string;
  backupId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupInterval: number; // em minutos
  maxBackups: number;
  compression: 'none' | 'gzip' | 'brotli';
  encryption: boolean;
  cloudSync: boolean;
  syncProvider: 'supabase' | 'aws' | 'google' | 'azure';
  retentionDays: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
  conflictsCount: number;
}

class BackupService {
  private backupJobs: Map<string, BackupJob> = new Map();
  private restoreJobs: Map<string, RestoreJob> = new Map();
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    syncInProgress: false,
    conflictsCount: 0
  };
  private autoBackupIntervals: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeNetworkListeners();
    this.initializeAutoSync();
  }

  private initializeNetworkListeners() {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.emit('networkStatusChanged', this.syncStatus);
      this.resumeSync();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.emit('networkStatusChanged', this.syncStatus);
    });
  }

  private initializeAutoSync() {
    // Sincronização automática a cada 5 minutos quando online
    setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.syncPendingChanges();
      }
    }, 5 * 60 * 1000);
  }

  // Gerenciamento de eventos
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Backup manual
  async createBackup(
    projectId: string, 
    type: 'manual' | 'auto' | 'scheduled' = 'manual'
  ): Promise<string> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const backupJob: BackupJob = {
      id: backupId,
      projectId,
      type,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      size: 0,
      location: '',
      metadata: {
        version: '1.0.0',
        checksum: '',
        compression: 'gzip',
        encryption: true
      }
    };

    this.backupJobs.set(backupId, backupJob);
    this.emit('backupStarted', backupJob);

    try {
      // Iniciar backup
      backupJob.status = 'running';
      this.emit('backupProgress', backupJob);

      // 1. Coletar dados do projeto
      const projectData = await this.collectProjectData(projectId);
      backupJob.progress = 25;
      this.emit('backupProgress', backupJob);

      // 2. Comprimir dados
      const compressedData = await this.compressData(projectData, backupJob.metadata.compression);
      backupJob.progress = 50;
      backupJob.size = compressedData.byteLength;
      this.emit('backupProgress', backupJob);

      // 3. Criptografar se necessário
      let finalData = compressedData;
      if (backupJob.metadata.encryption) {
        finalData = await this.encryptData(compressedData);
      }
      backupJob.progress = 75;
      this.emit('backupProgress', backupJob);

      // 4. Calcular checksum
      backupJob.metadata.checksum = await this.calculateChecksum(finalData);

      // 5. Salvar backup
      const location = await this.saveBackup(backupId, finalData);
      backupJob.location = location;
      backupJob.progress = 100;
      backupJob.status = 'completed';
      backupJob.completedAt = new Date();

      this.emit('backupCompleted', backupJob);
      
      // Salvar metadados no banco
      await this.saveBackupMetadata(backupJob);

      toast.success('Backup criado com sucesso!');
      return backupId;
    } catch (error) {
      backupJob.status = 'failed';
      backupJob.error = error instanceof Error ? error.message : 'Erro desconhecido';
      this.emit('backupFailed', backupJob);
      
      console.error('Erro ao criar backup:', error);
      toast.error('Erro ao criar backup');
      throw error;
    }
  }

  // Restaurar backup
  async restoreBackup(projectId: string, backupId: string): Promise<string> {
    const restoreId = `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const restoreJob: RestoreJob = {
      id: restoreId,
      projectId,
      backupId,
      status: 'pending',
      progress: 0,
      startedAt: new Date()
    };

    this.restoreJobs.set(restoreId, restoreJob);
    this.emit('restoreStarted', restoreJob);

    try {
      restoreJob.status = 'running';
      this.emit('restoreProgress', restoreJob);

      // 1. Buscar backup
      const backupJob = await this.getBackupMetadata(backupId);
      if (!backupJob) {
        throw new Error('Backup não encontrado');
      }

      restoreJob.progress = 20;
      this.emit('restoreProgress', restoreJob);

      // 2. Baixar dados do backup
      const backupData = await this.downloadBackup(backupJob.location);
      restoreJob.progress = 40;
      this.emit('restoreProgress', restoreJob);

      // 3. Verificar integridade
      const checksum = await this.calculateChecksum(backupData);
      if (checksum !== backupJob.metadata.checksum) {
        throw new Error('Backup corrompido - checksum inválido');
      }

      restoreJob.progress = 60;
      this.emit('restoreProgress', restoreJob);

      // 4. Descriptografar se necessário
      let processedData = backupData;
      if (backupJob.metadata.encryption) {
        processedData = await this.decryptData(backupData);
      }

      // 5. Descomprimir
      const projectData = await this.decompressData(processedData, backupJob.metadata.compression);
      restoreJob.progress = 80;
      this.emit('restoreProgress', restoreJob);

      // 6. Restaurar projeto
      await this.restoreProjectData(projectId, projectData);
      restoreJob.progress = 100;
      restoreJob.status = 'completed';
      restoreJob.completedAt = new Date();

      this.emit('restoreCompleted', restoreJob);
      toast.success('Backup restaurado com sucesso!');
      return restoreId;
    } catch (error) {
      restoreJob.status = 'failed';
      restoreJob.error = error instanceof Error ? error.message : 'Erro desconhecido';
      this.emit('restoreFailed', restoreJob);
      
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro ao restaurar backup');
      throw error;
    }
  }

  // Configurar backup automático
  async setupAutoBackup(projectId: string, settings: BackupSettings) {
    // Limpar intervalo anterior se existir
    const existingInterval = this.autoBackupIntervals.get(projectId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    if (settings.autoBackup && settings.backupInterval > 0) {
      const interval = setInterval(async () => {
        try {
          await this.createBackup(projectId, 'auto');
          await this.cleanupOldBackups(projectId, settings.maxBackups);
        } catch (error) {
          console.error('Erro no backup automático:', error);
        }
      }, settings.backupInterval * 60 * 1000);

      this.autoBackupIntervals.set(projectId, interval);
    }

    // Salvar configurações
    await this.saveBackupSettings(projectId, settings);
  }

  // Sincronização na nuvem
  async syncToCloud(projectId: string): Promise<void> {
    if (!this.syncStatus.isOnline) {
      throw new Error('Sem conexão com a internet');
    }

    if (this.syncStatus.syncInProgress) {
      throw new Error('Sincronização já em andamento');
    }

    this.syncStatus.syncInProgress = true;
    this.emit('syncStarted', { projectId });

    try {
      // 1. Verificar mudanças locais
      const localChanges = await this.getLocalChanges(projectId);
      
      // 2. Buscar mudanças remotas
      const remoteChanges = await this.getRemoteChanges(projectId);
      
      // 3. Detectar conflitos
      const conflicts = this.detectConflicts(localChanges, remoteChanges);
      
      if (conflicts.length > 0) {
        this.syncStatus.conflictsCount = conflicts.length;
        this.emit('syncConflicts', { projectId, conflicts });
        return;
      }

      // 4. Aplicar mudanças remotas
      await this.applyRemoteChanges(projectId, remoteChanges);
      
      // 5. Enviar mudanças locais
      await this.pushLocalChanges(projectId, localChanges);
      
      this.syncStatus.lastSync = new Date();
      this.syncStatus.pendingChanges = 0;
      this.emit('syncCompleted', { projectId });
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      this.emit('syncFailed', { projectId, error });
      throw error;
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  // Sincronizar mudanças pendentes
  private async syncPendingChanges() {
    try {
      const projectsWithChanges = await this.getProjectsWithPendingChanges();
      
      for (const projectId of projectsWithChanges) {
        await this.syncToCloud(projectId);
      }
    } catch (error) {
      console.error('Erro ao sincronizar mudanças pendentes:', error);
    }
  }

  // Retomar sincronização quando voltar online
  private async resumeSync() {
    if (this.syncStatus.pendingChanges > 0) {
      await this.syncPendingChanges();
    }
  }

  // Métodos auxiliares
  private async collectProjectData(projectId: string): Promise<any> {
    // Simular coleta de dados do projeto
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    const { data: timeline } = await supabase
      .from('timeline_items')
      .select('*')
      .eq('project_id', projectId);

    const { data: assets } = await supabase
      .from('project_assets')
      .select('*')
      .eq('project_id', projectId);

    return {
      project,
      timeline,
      assets,
      timestamp: new Date().toISOString()
    };
  }

  private async compressData(data: any, compression: string): Promise<ArrayBuffer> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(jsonString);

    if (compression === 'gzip') {
      // Simular compressão gzip
      return uint8Array.buffer;
    }
    
    return uint8Array.buffer;
  }

  private async decompressData(data: ArrayBuffer, compression: string): Promise<any> {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(data);
    return JSON.parse(jsonString);
  }

  private async encryptData(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Simular criptografia
    return data;
  }

  private async decryptData(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Simular descriptografia
    return data;
  }

  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async saveBackup(backupId: string, data: ArrayBuffer): Promise<string> {
    // Simular salvamento no Supabase Storage
    const fileName = `backups/${backupId}.backup`;
    
    const { data: uploadData, error } = await supabase.storage
      .from('project-backups')
      .upload(fileName, data);

    if (error) throw error;
    
    return fileName;
  }

  private async downloadBackup(location: string): Promise<ArrayBuffer> {
    const { data, error } = await supabase.storage
      .from('project-backups')
      .download(location);

    if (error) throw error;
    
    return await data.arrayBuffer();
  }

  private async saveBackupMetadata(backup: BackupJob): Promise<void> {
    const { error } = await supabase
      .from('project_backups')
      .insert({
        id: backup.id,
        project_id: backup.projectId,
        type: backup.type,
        status: backup.status,
        size: backup.size,
        location: backup.location,
        metadata: backup.metadata,
        created_at: backup.startedAt.toISOString(),
        completed_at: backup.completedAt?.toISOString()
      });

    if (error) throw error;
  }

  private async getBackupMetadata(backupId: string): Promise<BackupJob | null> {
    const { data, error } = await supabase
      .from('project_backups')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error) return null;
    
    return {
      id: data.id,
      projectId: data.project_id,
      type: data.type,
      status: data.status,
      progress: 100,
      startedAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      size: data.size,
      location: data.location,
      metadata: data.metadata
    };
  }

  private async restoreProjectData(projectId: string, data: any): Promise<void> {
    // Simular restauração dos dados do projeto
    const { project, timeline, assets } = data;
    
    // Atualizar projeto
    await supabase
      .from('projects')
      .update(project)
      .eq('id', projectId);
    
    // Restaurar timeline
    if (timeline) {
      await supabase
        .from('timeline_items')
        .delete()
        .eq('project_id', projectId);
      
      await supabase
        .from('timeline_items')
        .insert(timeline);
    }
    
    // Restaurar assets
    if (assets) {
      await supabase
        .from('project_assets')
        .delete()
        .eq('project_id', projectId);
      
      await supabase
        .from('project_assets')
        .insert(assets);
    }
  }

  private async cleanupOldBackups(projectId: string, maxBackups: number): Promise<void> {
    const { data: backups } = await supabase
      .from('project_backups')
      .select('id, location')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (backups && backups.length > maxBackups) {
      const backupsToDelete = backups.slice(maxBackups);
      
      for (const backup of backupsToDelete) {
        // Deletar arquivo
        await supabase.storage
          .from('project-backups')
          .remove([backup.location]);
        
        // Deletar metadados
        await supabase
          .from('project_backups')
          .delete()
          .eq('id', backup.id);
      }
    }
  }

  private async saveBackupSettings(projectId: string, settings: BackupSettings): Promise<void> {
    const { error } = await supabase
      .from('project_settings')
      .upsert({
        project_id: projectId,
        backup_settings: settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  private async getLocalChanges(projectId: string): Promise<any[]> {
    // Simular busca de mudanças locais
    return [];
  }

  private async getRemoteChanges(projectId: string): Promise<any[]> {
    // Simular busca de mudanças remotas
    return [];
  }

  private detectConflicts(localChanges: any[], remoteChanges: any[]): any[] {
    // Simular detecção de conflitos
    return [];
  }

  private async applyRemoteChanges(projectId: string, changes: any[]): Promise<void> {
    // Simular aplicação de mudanças remotas
  }

  private async pushLocalChanges(projectId: string, changes: any[]): Promise<void> {
    // Simular envio de mudanças locais
  }

  private async getProjectsWithPendingChanges(): Promise<string[]> {
    // Simular busca de projetos com mudanças pendentes
    return [];
  }

  // Métodos públicos para obter status
  getBackupJob(backupId: string): BackupJob | undefined {
    return this.backupJobs.get(backupId);
  }

  getRestoreJob(restoreId: string): RestoreJob | undefined {
    return this.restoreJobs.get(restoreId);
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async getBackupHistory(projectId: string): Promise<BackupJob[]> {
    const { data, error } = await supabase
      .from('project_backups')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(backup => ({
      id: backup.id,
      projectId: backup.project_id,
      type: backup.type,
      status: backup.status,
      progress: 100,
      startedAt: new Date(backup.created_at),
      completedAt: backup.completed_at ? new Date(backup.completed_at) : undefined,
      size: backup.size,
      location: backup.location,
      metadata: backup.metadata
    }));
  }

  async getBackupSettings(projectId: string): Promise<BackupSettings | null> {
    const { data, error } = await supabase
      .from('project_settings')
      .select('backup_settings')
      .eq('project_id', projectId)
      .single();

    if (error) return null;
    
    return data.backup_settings;
  }
}

export const backupService = new BackupService();