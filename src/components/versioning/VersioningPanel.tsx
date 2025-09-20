import React, { useState, useEffect } from 'react'
import { GitBranch, History, Save, RotateCcw, GitMerge, Archive, Settings, Plus, Trash2, Eye, Download, Upload, Clock, User, Tag } from 'lucide-react'
import { useVersioning } from '@/hooks/useVersioning'
import type { ProjectVersionAdvanced, ProjectBranch, BackupJob } from '@/types/versioning'
import { toast } from 'sonner'

interface VersioningPanelProps {
  projectId: string
  isVisible: boolean
  onToggle: () => void
  className?: string
}

export function VersioningPanel({
  projectId,
  isVisible,
  onToggle,
  className = ''
}: VersioningPanelProps) {
  const {
    versions,
    currentVersion,
    branches,
    currentBranch,
    backups,
    settings,
    createVersion,
    restoreVersion,
    compareVersions,
    deleteVersion,
    createBranch,
    switchBranch,
    mergeBranch,
    deleteBranch,
    createBackup,
    restoreFromBackup,
    deleteBackup,
    hasUnsavedChanges,
    isAutoSaveEnabled,
    lastAutoSave,
    enableAutoSave,
    disableAutoSave,
    loading,
    error
  } = useVersioning({ projectId })

  const [activeTab, setActiveTab] = useState<'versions' | 'branches' | 'backups' | 'settings'>('versions')
  const [versionDescription, setVersionDescription] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchDescription, setBranchDescription] = useState('')
  const [backupDescription, setBackupDescription] = useState('')
  const [showCreateVersion, setShowCreateVersion] = useState(false)
  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [showCreateBackup, setShowCreateBackup] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)

  const handleCreateVersion = async () => {
    if (!versionDescription.trim()) {
      toast.error('Descrição da versão é obrigatória')
      return
    }
    
    try {
      await createVersion(versionDescription)
      setVersionDescription('')
      setShowCreateVersion(false)
    } catch (err) {
      // Erro já tratado no hook
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('Tem certeza que deseja restaurar esta versão? As alterações não salvas serão perdidas.')) {
      return
    }
    
    try {
      await restoreVersion(versionId)
    } catch (err) {
      // Erro já tratado no hook
    }
  }

  const handleCreateBranch = async () => {
    if (!branchName.trim()) {
      toast.error('Nome do branch é obrigatório')
      return
    }
    
    try {
      await createBranch(branchName, branchDescription)
      setBranchName('')
      setBranchDescription('')
      setShowCreateBranch(false)
    } catch (err) {
      // Erro já tratado no hook
    }
  }

  const handleSwitchBranch = async (branchId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm('Você tem alterações não salvas. Deseja continuar?')) {
        return
      }
    }
    
    try {
      await switchBranch(branchId)
    } catch (err) {
      // Erro já tratado no hook
    }
  }

  const handleMergeBranch = async (sourceBranchId: string, targetBranchId: string) => {
    try {
      await mergeBranch(sourceBranchId, targetBranchId)
    } catch (err) {
      // Erro já tratado no hook
    }
  }

  const handleCreateBackup = async () => {
    try {
      await createBackup(backupDescription || undefined)
      setBackupDescription('')
      setShowCreateBackup(false)
    } catch (err) {
      // Erro já tratado no hook
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('Tem certeza que deseja restaurar este backup? Todas as alterações atuais serão perdidas.')) {
      return
    }
    
    try {
      await restoreFromBackup(backupId)
    } catch (err) {
      // Erro já tratado no hook
    }
  }

  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) {
      toast.error('Selecione exatamente 2 versões para comparar')
      return
    }
    
    try {
      const comparison = await compareVersions(selectedVersions[0], selectedVersions[1])
      setShowComparison(true)
      toast.success('Comparação de versões gerada com sucesso')
      // Aqui você pode abrir um modal ou painel de comparação
    } catch (err) {
      // Erro já tratado no hook
    }
  }

  const handleToggleVersionSelection = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      } else if (prev.length < 2) {
        return [...prev, versionId]
      } else {
        return [prev[1], versionId]
      }
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={`bg-white border-l border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Controle de Versão</h3>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        {/* Status */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center text-sm text-gray-600">
            <GitBranch className="w-4 h-4 mr-2" />
            Branch: {currentBranch?.name || 'main'}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Tag className="w-4 h-4 mr-2" />
            Versão: {currentVersion?.version || '1.0.0'}
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center text-sm text-orange-600">
              <Clock className="w-4 h-4 mr-2" />
              Alterações não salvas
            </div>
          )}
          {isAutoSaveEnabled && lastAutoSave && (
            <div className="flex items-center text-sm text-green-600">
              <Save className="w-4 h-4 mr-2" />
              Auto-save: {new Date(lastAutoSave).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {[
            { id: 'versions', name: 'Versões', icon: History },
            { id: 'branches', name: 'Branches', icon: GitBranch },
            { id: 'backups', name: 'Backups', icon: Archive },
            { id: 'settings', name: 'Configurações', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4 h-96 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Versions Tab */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Histórico de Versões</h4>
              <button
                onClick={() => setShowCreateVersion(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova Versão
              </button>
            </div>

            {selectedVersions.length === 2 && (
              <button
                onClick={handleCompareVersions}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Comparar Versões Selecionadas
              </button>
            )}

            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-3 ${
                    selectedVersions.includes(version.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(version.id)}
                        onChange={() => handleToggleVersionSelection(version.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{version.version}</span>
                          {version.id === currentVersion?.id && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{version.description}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <User className="w-3 h-3 mr-1" />
                          {version.author}
                          <Clock className="w-3 h-3 ml-3 mr-1" />
                          {new Date(version.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Restaurar versão"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteVersion(version.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir versão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Branches</h4>
              <button
                onClick={() => setShowCreateBranch(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo Branch
              </button>
            </div>

            <div className="space-y-2">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`border rounded-lg p-3 ${
                    branch.id === currentBranch?.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{branch.name}</span>
                        {branch.id === currentBranch?.id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Atual
                          </span>
                        )}
                      </div>
                      {branch.description && (
                        <p className="text-sm text-gray-600">{branch.description}</p>
                      )}
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <User className="w-3 h-3 mr-1" />
                        {branch.author}
                        <Clock className="w-3 h-3 ml-3 mr-1" />
                        {new Date(branch.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {branch.id !== currentBranch?.id && (
                        <>
                          <button
                            onClick={() => handleSwitchBranch(branch.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Trocar para este branch"
                          >
                            <GitBranch className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMergeBranch(branch.id, currentBranch?.id || 'main')}
                            className="text-green-600 hover:text-green-800"
                            title="Fazer merge"
                          >
                            <GitMerge className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBranch(branch.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir branch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backups Tab */}
        {activeTab === 'backups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Backups</h4>
              <button
                onClick={() => setShowCreateBackup(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Criar Backup
              </button>
            </div>

            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">Backup {backup.id.slice(0, 8)}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                          backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {backup.status === 'completed' ? 'Concluído' :
                           backup.status === 'failed' ? 'Falhou' : 'Em andamento'}
                        </span>
                      </div>
                      {backup.description && (
                        <p className="text-sm text-gray-600">{backup.description}</p>
                      )}
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(backup.createdAt).toLocaleString()}
                        {backup.size && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{(backup.size / 1024 / 1024).toFixed(2)} MB</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backup.status === 'completed' && (
                        <>
                          <button
                            onClick={() => handleRestoreBackup(backup.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Restaurar backup"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-800"
                            title="Download backup"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir backup"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Configurações</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto-save</label>
                  <p className="text-xs text-gray-500">Salvar automaticamente as alterações</p>
                </div>
                <button
                  onClick={isAutoSaveEnabled ? disableAutoSave : enableAutoSave}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isAutoSaveEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isAutoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Version Modal */}
      {showCreateVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Nova Versão</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição da Versão
                </label>
                <textarea
                  value={versionDescription}
                  onChange={(e) => setVersionDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Descreva as alterações desta versão..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateVersion(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateVersion}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Criar Versão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreateBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Branch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Branch
                </label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="feature/nova-funcionalidade"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={branchDescription}
                  onChange={(e) => setBranchDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Descreva o propósito deste branch..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateBranch(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBranch}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Criar Branch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Backup Modal */}
      {showCreateBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Backup</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Backup antes da implementação da nova funcionalidade..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateBackup(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBackup}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Criar Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VersioningPanel