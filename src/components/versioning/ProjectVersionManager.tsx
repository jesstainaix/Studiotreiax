// Componente para gerenciamento de versionamento de projetos
import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Save,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Cloud,
  CloudOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  Plus,
  Eye,
  Copy,
  Folder,
  Camera,
  Zap,
  Activity,
  HardDrive,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useProjectVersioning, useVersioningStats } from '../../hooks/useProjectVersioning';
import { ProjectVersion, ProjectChange, ProjectSnapshot, ConflictInfo } from '../../utils/projectVersioning';

interface ProjectVersionManagerProps {
  className?: string;
}

export function ProjectVersionManager({ className = '' }: ProjectVersionManagerProps) {
  const versioning = useProjectVersioning({
    autoSave: true,
    saveInterval: 30000,
    trackChanges: true,
    enableNotifications: true
  });
  
  const stats = useVersioningStats();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'versions' | 'branches' | 'snapshots' | 'conflicts' | 'settings'>('versions');
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null);
  const [newVersionMessage, setNewVersionMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('');
  const [showVersionDetails, setShowVersionDetails] = useState(false);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictInfo | null>(null);
  const [conflictResolution, setConflictResolution] = useState('');
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  
  // Handlers
  const handleCreateVersion = async () => {
    if (!newVersionMessage.trim()) return;
    
    try {
      await versioning.createVersion(newVersionMessage);
      setNewVersionMessage('');
    } catch (error) {
      console.error('Erro ao criar versão:', error);
    }
  };
  
  const handleRestoreVersion = async (versionId: string) => {
    if (confirm('Tem certeza que deseja restaurar esta versão? Mudanças não salvas serão perdidas.')) {
      await versioning.restoreVersion(versionId);
    }
  };
  
  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    
    try {
      versioning.createBranch(newBranchName);
      setNewBranchName('');
    } catch (error) {
      console.error('Erro ao criar branch:', error);
    }
  };
  
  const handleCreateSnapshot = async () => {
    if (!newSnapshotName.trim()) return;
    
    try {
      await versioning.createSnapshot(newSnapshotName, newSnapshotDescription);
      setNewSnapshotName('');
      setNewSnapshotDescription('');
    } catch (error) {
      console.error('Erro ao criar snapshot:', error);
    }
  };
  
  const handleResolveConflict = () => {
    if (!selectedConflict || !conflictResolution.trim()) return;
    
    versioning.resolveConflict(selectedConflict.path, conflictResolution);
    setSelectedConflict(null);
    setConflictResolution('');
    setShowConflictResolver(false);
  };
  
  const handleExport = async () => {
    try {
      const data = await versioning.exportProject();
      setExportData(data);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };
  
  const handleImport = async () => {
    if (!importData.trim()) return;
    
    try {
      await versioning.importProject(importData);
      setImportData('');
    } catch (error) {
      console.error('Erro ao importar:', error);
    }
  };
  
  // Formatação de dados
  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };
  
  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus className="w-4 h-4 text-green-500" />;
      case 'modified': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'deleted': return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getSyncStatusIcon = () => {
    switch (versioning.syncStatus) {
      case 'syncing': return <Activity className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Cloud className="w-4 h-4 text-gray-500" />;
    }
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Versionamento de Projeto
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {versioning.cloudStorage.autoSync ? (
              <div className="flex items-center space-x-1 text-green-600">
                {getSyncStatusIcon()}
                <span className="text-sm">Sincronizado</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-gray-500">
                <CloudOff className="w-4 h-4" />
                <span className="text-sm">Offline</span>
              </div>
            )}
            
            <button
              onClick={versioning.syncToCloud}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Sincronizar com nuvem"
            >
              <Cloud className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {stats.totalVersions} Versões
              </span>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                {stats.totalBranches} Branches
              </span>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                {stats.totalSnapshots} Snapshots
              </span>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                {formatFileSize(stats.totalSize)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Alertas */}
        {versioning.conflicts.filter(c => !c.resolved).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800 dark:text-red-200">
                {versioning.conflicts.filter(c => !c.resolved).length} conflito(s) precisam ser resolvidos
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'versions', label: 'Versões', icon: GitCommit },
            { id: 'branches', label: 'Branches', icon: GitBranch },
            { id: 'snapshots', label: 'Snapshots', icon: Camera },
            { id: 'conflicts', label: 'Conflitos', icon: AlertTriangle },
            { id: 'settings', label: 'Configurações', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'conflicts' && versioning.conflicts.filter(c => !c.resolved).length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {versioning.conflicts.filter(c => !c.resolved).length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Conteúdo das tabs */}
      <div className="p-6">
        {/* Tab: Versões */}
        {activeTab === 'versions' && (
          <div className="space-y-6">
            {/* Criar nova versão */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Criar Nova Versão
              </h3>
              
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newVersionMessage}
                  onChange={(e) => setNewVersionMessage(e.target.value)}
                  placeholder="Mensagem da versão..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateVersion()}
                />
                
                <button
                  onClick={handleCreateVersion}
                  disabled={!newVersionMessage.trim() || versioning.stats.changesCount === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar ({versioning.stats.changesCount})</span>
                </button>
              </div>
              
              {versioning.stats.changesCount === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Nenhuma mudança detectada para salvar
                </p>
              )}
            </div>
            
            {/* Lista de versões */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Histórico de Versões - Branch: {versioning.currentBranch}
              </h3>
              
              {versioning.getVersionHistory(10).map(version => (
                <div
                  key={version.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <GitCommit className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {version.message}
                        </span>
                        
                        {version.id === versioning.currentVersion && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Atual
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{formatDate(version.timestamp)}</span>
                        <span>{version.changes.length} mudança(s)</span>
                        <span>{formatFileSize(version.size)}</span>
                        <span>por {version.author}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedVersion(version);
                          setShowVersionDetails(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {version.id !== versioning.currentVersion && (
                        <button
                          onClick={() => handleRestoreVersion(version.id)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          title="Restaurar versão"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => versioning.deleteVersion(version.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Excluir versão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {versioning.versions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <GitCommit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma versão criada ainda</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Tab: Branches */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            {/* Criar novo branch */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Criar Novo Branch
              </h3>
              
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Nome do branch..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateBranch()}
                />
                
                <button
                  onClick={handleCreateBranch}
                  disabled={!newBranchName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar</span>
                </button>
              </div>
            </div>
            
            {/* Lista de branches */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Branches Disponíveis
              </h3>
              
              {versioning.branches.map(branch => {
                const branchVersions = versioning.getBranchVersions(branch);
                const isActive = branch === versioning.currentBranch;
                
                return (
                  <div
                    key={branch}
                    className={`border rounded-lg p-4 transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GitBranch className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`font-medium ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                          {branch}
                        </span>
                        
                        {isActive && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {branchVersions.length} versão(ões)
                        </span>
                        
                        {!isActive && (
                          <button
                            onClick={() => versioning.switchBranch(branch)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Trocar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Tab: Snapshots */}
        {activeTab === 'snapshots' && (
          <div className="space-y-6">
            {/* Criar novo snapshot */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Criar Novo Snapshot
              </h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  placeholder="Nome do snapshot..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                
                <textarea
                  value={newSnapshotDescription}
                  onChange={(e) => setNewSnapshotDescription(e.target.value)}
                  placeholder="Descrição (opcional)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                
                <button
                  onClick={handleCreateSnapshot}
                  disabled={!newSnapshotName.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Criar Snapshot</span>
                </button>
              </div>
            </div>
            
            {/* Lista de snapshots */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Snapshots Salvos
              </h3>
              
              {versioning.snapshots.map(snapshot => (
                <div
                  key={snapshot.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Camera className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {snapshot.name}
                        </span>
                      </div>
                      
                      {snapshot.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {snapshot.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{formatDate(snapshot.timestamp)}</span>
                        <span>{formatFileSize(snapshot.size)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => versioning.restoreSnapshot(snapshot.id)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                        title="Restaurar snapshot"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {versioning.snapshots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum snapshot criado ainda</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Tab: Conflitos */}
        {activeTab === 'conflicts' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Resolução de Conflitos
            </h3>
            
            {versioning.conflicts.filter(c => !c.resolved).map(conflict => (
              <div
                key={conflict.path}
                className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-900 dark:text-red-100">
                      {conflict.path}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedConflict(conflict);
                      setShowConflictResolver(true);
                    }}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Resolver
                  </button>
                </div>
                
                <p className="text-sm text-red-800 dark:text-red-200">
                  {conflict.description}
                </p>
              </div>
            ))}
            
            {versioning.conflicts.filter(c => !c.resolved).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>Nenhum conflito pendente</p>
              </div>
            )}
          </div>
        )}
        
        {/* Tab: Configurações */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Configurações de Versionamento
            </h3>
            
            {/* Backup automático */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Backup Automático
              </h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={versioning.backupConfig.enabled}
                    onChange={(e) => versioning.updateBackupConfig({ enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Habilitar backup automático
                  </span>
                </label>
                
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Intervalo (minutos):
                  </label>
                  <input
                    type="number"
                    value={versioning.backupConfig.interval / 60000}
                    onChange={(e) => versioning.updateBackupConfig({ interval: parseInt(e.target.value) * 60000 })}
                    min="1"
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Sincronização com nuvem */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Sincronização com Nuvem
              </h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={versioning.cloudStorage.autoSync}
                    onChange={(e) => versioning.updateCloudConfig({ autoSync: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Sincronização automática
                  </span>
                </label>
                
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Provedor:
                  </label>
                  <select
                    value={versioning.cloudStorage.provider}
                    onChange={(e) => versioning.updateCloudConfig({ provider: e.target.value as any })}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="github">GitHub</option>
                    <option value="gitlab">GitLab</option>
                    <option value="bitbucket">Bitbucket</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Exportar/Importar */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Exportar/Importar Projeto
              </h4>
              
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar</span>
                  </button>
                  
                  <button
                    onClick={handleImport}
                    disabled={!importData.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Importar</span>
                  </button>
                </div>
                
                {exportData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dados Exportados:
                    </label>
                    <textarea
                      value={exportData}
                      readOnly
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(exportData)}
                      className="mt-2 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copiar</span>
                    </button>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dados para Importar:
                  </label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Cole os dados do projeto aqui..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal: Detalhes da versão */}
      {showVersionDetails && selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detalhes da Versão
                </h3>
                <button
                  onClick={() => setShowVersionDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Informações
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-2">
                    <p><strong>ID:</strong> {selectedVersion.id}</p>
                    <p><strong>Mensagem:</strong> {selectedVersion.message}</p>
                    <p><strong>Autor:</strong> {selectedVersion.author}</p>
                    <p><strong>Data:</strong> {formatDate(selectedVersion.timestamp)}</p>
                    <p><strong>Branch:</strong> {selectedVersion.metadata.branch}</p>
                    <p><strong>Tamanho:</strong> {formatFileSize(selectedVersion.size)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Mudanças ({selectedVersion.changes.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedVersion.changes.map((change, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        {getChangeTypeIcon(change.type)}
                        <span className="flex-1 text-sm font-mono">{change.path}</span>
                        <span className="text-xs text-gray-500 capitalize">{change.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Resolver conflito */}
      {showConflictResolver && selectedConflict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resolver Conflito
                </h3>
                <button
                  onClick={() => setShowConflictResolver(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Arquivo: <span className="font-mono">{selectedConflict.path}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedConflict.description}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Resolução:
                  </label>
                  <textarea
                    value={conflictResolution}
                    onChange={(e) => setConflictResolution(e.target.value)}
                    placeholder="Digite a resolução do conflito..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowConflictResolver(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleResolveConflict}
                    disabled={!conflictResolution.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resolver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}