import React, { useState } from 'react';
import { useBackup } from '../../hooks/useBackup';
import { BackupJob, BackupSettings } from '../../services/backupService';
import { 
  Cloud, 
  CloudOff, 
  Download, 
  Upload, 
  Settings, 
  History, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';

interface BackupManagerProps {
  projectId: string;
  className?: string;
}

export function BackupManager({ projectId, className = '' }: BackupManagerProps) {
  const {
    backupJobs,
    restoreJobs,
    syncStatus,
    backupSettings,
    isCreatingBackup,
    isRestoring,
    isSyncing,
    backupHistory,
    createBackup,
    restoreBackup,
    deleteBackup,
    syncToCloud,
    setupAutoBackup,
    updateBackupSettings,
    resolveConflict,
    formatBackupSize,
    getBackupAge,
    canRestore
  } = useBackup(projectId);

  const [activeTab, setActiveTab] = useState<'backups' | 'sync' | 'settings'>('backups');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupJob | null>(null);
  const [settingsForm, setSettingsForm] = useState<BackupSettings>({
    autoBackup: false,
    backupInterval: 60,
    maxBackups: 10,
    compression: 'gzip',
    encryption: true,
    cloudSync: true,
    syncProvider: 'supabase',
    retentionDays: 30
  });

  // Atualizar form quando as configurações carregarem
  React.useEffect(() => {
    if (backupSettings) {
      setSettingsForm(backupSettings);
    }
  }, [backupSettings]);

  const handleCreateBackup = async () => {
    const backupId = await createBackup(projectId, 'manual');
    if (backupId) {
      toast.success('Backup iniciado com sucesso');
    }
  };

  const handleRestoreBackup = async (backup: BackupJob) => {
    if (!canRestore(backup)) {
      toast.error('Não é possível restaurar este backup');
      return;
    }

    const confirmed = window.confirm(
      'Tem certeza que deseja restaurar este backup? Todas as alterações não salvas serão perdidas.'
    );
    
    if (confirmed) {
      const restoreId = await restoreBackup(projectId, backup.id);
      if (restoreId) {
        toast.success('Restauração iniciada');
      }
    }
  };

  const handleDeleteBackup = async (backup: BackupJob) => {
    const confirmed = window.confirm(
      'Tem certeza que deseja deletar este backup? Esta ação não pode ser desfeita.'
    );
    
    if (confirmed) {
      await deleteBackup(backup.id);
    }
  };

  const handleSyncToCloud = async () => {
    await syncToCloud(projectId);
  };

  const handleSaveSettings = async () => {
    await setupAutoBackup(projectId, settingsForm);
    setShowSettings(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Backup & Sincronização</h3>
              <p className="text-sm text-gray-500">
                Gerencie backups e sincronização na nuvem
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status de conexão */}
            <div className="flex items-center gap-1 text-sm">
              {syncStatus.isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">Offline</span>
                </>
              )}
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {[
            { id: 'backups', label: 'Backups', icon: HardDrive },
            { id: 'sync', label: 'Sincronização', icon: Cloud },
            { id: 'settings', label: 'Configurações', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'backups' && (
          <div className="space-y-4">
            {/* Ações de backup */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Backups do Projeto</h4>
              <button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingBackup ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isCreatingBackup ? 'Criando...' : 'Criar Backup'}
              </button>
            </div>

            {/* Jobs de backup em andamento */}
            {backupJobs.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Em Andamento</h5>
                {backupJobs.map(job => (
                  <div key={job.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="text-sm font-medium">
                          Backup {job.type === 'manual' ? 'Manual' : 'Automático'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {job.progress}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(job.progress)}`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    
                    {job.error && (
                      <p className="text-sm text-red-600 mt-2">{job.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Histórico de backups */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Histórico</h5>
              
              {backupHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HardDrive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum backup encontrado</p>
                  <p className="text-sm">Crie seu primeiro backup para começar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backupHistory.map(backup => (
                    <div key={backup.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(backup.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                Backup {backup.type === 'manual' ? 'Manual' : 'Automático'}
                              </span>
                              {backup.metadata.encryption && (
                                <Shield className="w-3 h-3 text-green-500" title="Criptografado" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{getBackupAge(backup)}</span>
                              <span>{formatBackupSize(backup.size)}</span>
                              <span>v{backup.metadata.version}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {canRestore(backup) && (
                            <button
                              onClick={() => handleRestoreBackup(backup)}
                              disabled={isRestoring}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Restaurar backup"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteBackup(backup)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Deletar backup"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="space-y-4">
            {/* Status de sincronização */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Status da Sincronização</h4>
                <button
                  onClick={handleSyncToCloud}
                  disabled={isSyncing || !syncStatus.isOnline}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Última Sincronização</p>
                  <p className="font-medium">
                    {syncStatus.lastSync 
                      ? new Date(syncStatus.lastSync).toLocaleString()
                      : 'Nunca'
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Mudanças Pendentes</p>
                  <p className="font-medium">{syncStatus.pendingChanges}</p>
                </div>
              </div>
              
              {syncStatus.conflictsCount > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {syncStatus.conflictsCount} conflito(s) detectado(s)
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Resolva os conflitos para continuar a sincronização.
                  </p>
                </div>
              )}
            </div>

            {/* Jobs de restauração */}
            {restoreJobs.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Restaurações em Andamento</h5>
                {restoreJobs.map(job => (
                  <div key={job.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="text-sm font-medium">Restaurando Backup</span>
                      </div>
                      <span className="text-sm text-gray-500">{job.progress}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(job.progress)}`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    
                    {job.error && (
                      <p className="text-sm text-red-600 mt-2">{job.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Backup Automático */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Backup Automático</h4>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settingsForm.autoBackup}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, autoBackup: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Ativar backup automático</span>
                </label>
                
                {settingsForm.autoBackup && (
                  <div className="ml-7 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intervalo (minutos)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="1440"
                        value={settingsForm.backupInterval}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, backupInterval: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Máximo de backups
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={settingsForm.maxBackups}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, maxBackups: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compressão e Segurança */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Compressão e Segurança</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de compressão
                  </label>
                  <select
                    value={settingsForm.compression}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, compression: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="none">Sem compressão</option>
                    <option value="gzip">GZIP</option>
                    <option value="brotli">Brotli</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settingsForm.encryption}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, encryption: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Criptografar backups</span>
                </label>
              </div>
            </div>

            {/* Sincronização na Nuvem */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Sincronização na Nuvem</h4>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settingsForm.cloudSync}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, cloudSync: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Ativar sincronização na nuvem</span>
                </label>
                
                {settingsForm.cloudSync && (
                  <div className="ml-7 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provedor
                      </label>
                      <select
                        value={settingsForm.syncProvider}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, syncProvider: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="supabase">Supabase</option>
                        <option value="aws">AWS S3</option>
                        <option value="google">Google Drive</option>
                        <option value="azure">Azure Blob</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Retenção (dias)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={settingsForm.retentionDays}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar Configurações
              </button>
              
              <button
                onClick={() => setSettingsForm(backupSettings || settingsForm)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}