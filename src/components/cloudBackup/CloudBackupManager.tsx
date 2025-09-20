// Componente de gerenciamento de backup automático na nuvem
import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Upload,
  Download,
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  FileText,
  Folder,
  Database,
  Image,
  Video,
  Music,
  Archive,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Search,
  MoreVertical,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  HardDrive,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Compress,
  FileCheck,
  AlertCircle,
  Target,
  Layers,
  GitBranch
} from 'lucide-react';
import { useCloudBackup, useCloudBackupStats, useCloudBackupConfig } from '../../hooks/useCloudBackup';
import { BackupFile, BackupRule, CloudProvider, BackupJob, SyncConflict } from '../../utils/cloudBackup';

const CloudBackupManager: React.FC = () => {
  // Hooks
  const {
    files,
    rules,
    providers,
    jobs,
    conflicts,
    stats,
    isBackingUp,
    isRestoring,
    currentJob,
    startBackup,
    pauseBackup,
    resumeBackup,
    cancelBackup,
    addFile,
    removeFile,
    addRule,
    removeRule,
    updateRule,
    toggleRule,
    addProvider,
    removeProvider,
    testProvider,
    resolveConflict,
    scanForChanges,
    verifyIntegrity,
    cleanupOldVersions,
    optimizeStorage,
    formatFileSize,
    formatDuration,
    getProviderIcon,
    getStatusColor,
    bulkOperations
  } = useCloudBackup({
    autoStart: true,
    enableNotifications: true,
    enableKeyboardShortcuts: true,
    monitorChanges: true
  });
  
  const backupStats = useCloudBackupStats();
  const { config, updateConfig, toggleSetting } = useCloudBackupConfig();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'files' | 'rules' | 'providers' | 'jobs' | 'conflicts' | 'stats' | 'settings'>('files');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<BackupFile['type'] | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<BackupFile['status'] | 'all'>('all');
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Filtros
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    const matchesStatus = filterStatus === 'all' || file.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Handlers
  const handleStartBackup = async () => {
    if (selectedFiles.length > 0) {
      await startBackup(undefined, selectedFiles);
      setSelectedFiles([]);
    } else {
      await startBackup();
    }
  };
  
  const handleAddFile = () => {
    const mockFile = {
      name: `arquivo_${Date.now()}.json`,
      path: `/projects/arquivo_${Date.now()}.json`,
      size: Math.floor(Math.random() * 1024 * 1024),
      type: 'project' as const,
      lastModified: Date.now(),
      checksum: Math.random().toString(36),
      version: 1,
      isEncrypted: false,
      metadata: {},
      tags: ['demo'],
      priority: 'medium' as const,
      localPath: `/local/arquivo_${Date.now()}.json`
    };
    
    addFile(mockFile);
    setShowAddFileModal(false);
  };
  
  const handleAddRule = () => {
    const mockRule = {
      name: `Regra ${Date.now()}`,
      description: 'Regra de backup automático',
      enabled: true,
      patterns: ['*.json', '*.txt'],
      excludePatterns: ['*.tmp'],
      schedule: {
        type: 'interval' as const,
        value: 3600000 // 1 hora
      },
      retention: {
        maxVersions: 10,
        maxAge: 30,
        keepDaily: 7,
        keepWeekly: 4,
        keepMonthly: 12
      },
      compression: {
        enabled: true,
        algorithm: 'gzip' as const,
        level: 6
      },
      encryption: {
        enabled: true,
        algorithm: 'AES-256' as const,
        keyDerivation: 'PBKDF2' as const
      },
      priority: 'medium' as const,
      conditions: {},
      actions: {
        onConflict: 'rename' as const
      }
    };
    
    addRule(mockRule);
    setShowAddRuleModal(false);
  };
  
  const handleAddProvider = () => {
    const mockProvider = {
      name: `Provedor ${Date.now()}`,
      type: 'aws-s3' as const,
      enabled: true,
      config: {
        bucket: 'my-backup-bucket',
        region: 'us-east-1'
      },
      limits: {
        maxFileSize: 1024 * 1024 * 1024, // 1GB
        maxTotalSize: 1024 * 1024 * 1024 * 100, // 100GB
        maxRequests: 1000,
        rateLimitWindow: 3600000
      },
      features: {
        versioning: true,
        encryption: true,
        compression: true,
        incremental: true,
        deduplication: true
      },
      usage: {
        used: 0,
        total: 1024 * 1024 * 1024 * 100,
        files: 0
      }
    };
    
    addProvider(mockProvider);
    setShowAddProviderModal(false);
  };
  
  const handleResolveConflict = (resolution: SyncConflict['resolution']) => {
    if (selectedConflict) {
      resolveConflict(selectedConflict.id, resolution);
      setSelectedConflict(null);
      setShowConflictModal(false);
    }
  };
  
  const getFileIcon = (type: BackupFile['type']) => {
    const icons = {
      project: FileText,
      asset: Image,
      config: Settings,
      database: Database,
      other: Folder
    };
    return icons[type] || Folder;
  };
  
  const getJobIcon = (status: BackupJob['status']) => {
    const icons = {
      pending: Clock,
      running: Play,
      completed: CheckCircle,
      failed: XCircle,
      cancelled: Square,
      paused: Pause
    };
    return icons[status] || Clock;
  };
  
  const renderFilesTab = () => (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleStartBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isBackingUp ? 'Fazendo Backup...' : 'Iniciar Backup'}
          </button>
          
          <button
            onClick={() => setShowAddFileModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Adicionar Arquivo
          </button>
          
          <button
            onClick={scanForChanges}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" />
            Escanear
          </button>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="project">Projetos</option>
            <option value="asset">Assets</option>
            <option value="config">Configuração</option>
            <option value="database">Banco de dados</option>
            <option value="other">Outros</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="uploading">Enviando</option>
            <option value="completed">Concluído</option>
            <option value="failed">Falhou</option>
            <option value="syncing">Sincronizando</option>
            <option value="conflict">Conflito</option>
          </select>
        </div>
      </div>
      
      {/* Lista de arquivos */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFiles(filteredFiles.map(f => f.id));
                      } else {
                        setSelectedFiles([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Arquivo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Tamanho</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Progresso</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFiles.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles([...selectedFiles, file.id]);
                          } else {
                            setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileIcon className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-500">{file.path}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {file.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        file.status === 'completed' ? 'bg-green-100 text-green-800' :
                        file.status === 'failed' ? 'bg-red-100 text-red-800' :
                        file.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                        file.status === 'conflict' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {file.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{file.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredFiles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum arquivo encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderRulesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Regras de Backup</h3>
        <button
          onClick={() => setShowAddRuleModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nova Regra
        </button>
      </div>
      
      <div className="grid gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  rule.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <h4 className="font-semibold">{rule.name}</h4>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    rule.enabled 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {rule.enabled ? 'Ativo' : 'Inativo'}
                </button>
                
                <button
                  onClick={() => removeRule(rule.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{rule.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Padrões:</span>
                <div className="text-gray-600">{rule.patterns.join(', ')}</div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Agendamento:</span>
                <div className="text-gray-600">{rule.schedule.type}</div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Compressão:</span>
                <div className="text-gray-600">
                  {rule.compression.enabled ? rule.compression.algorithm : 'Desabilitada'}
                </div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Criptografia:</span>
                <div className="text-gray-600">
                  {rule.encryption.enabled ? rule.encryption.algorithm : 'Desabilitada'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {rules.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma regra configurada</p>
        </div>
      )}
    </div>
  );
  
  const renderProvidersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Provedores de Nuvem</h3>
        <button
          onClick={() => setShowAddProviderModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Novo Provedor
        </button>
      </div>
      
      <div className="grid gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getProviderIcon(provider.type)}</span>
                <div>
                  <h4 className="font-semibold">{provider.name}</h4>
                  <p className="text-sm text-gray-600">{provider.type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  provider.status === 'connected' ? 'bg-green-100 text-green-800' :
                  provider.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {provider.status === 'connected' && <Wifi className="w-3 h-3 mr-1" />}
                  {provider.status === 'disconnected' && <WifiOff className="w-3 h-3 mr-1" />}
                  {provider.status}
                </span>
                
                <button
                  onClick={() => testProvider(provider.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                >
                  Testar
                </button>
                
                <button
                  onClick={() => removeProvider(provider.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Usado:</span>
                <div className="text-gray-600">{formatFileSize(provider.usage.used)}</div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Total:</span>
                <div className="text-gray-600">{formatFileSize(provider.usage.total)}</div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Arquivos:</span>
                <div className="text-gray-600">{provider.usage.files}</div>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Recursos:</span>
                <div className="flex gap-1">
                  {provider.features.versioning && <GitBranch className="w-4 h-4 text-blue-500" title="Versionamento" />}
                  {provider.features.encryption && <Lock className="w-4 h-4 text-green-500" title="Criptografia" />}
                  {provider.features.compression && <Compress className="w-4 h-4 text-purple-500" title="Compressão" />}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uso do armazenamento</span>
                <span>{Math.round((provider.usage.used / provider.usage.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(provider.usage.used / provider.usage.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {providers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Cloud className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum provedor configurado</p>
        </div>
      )}
    </div>
  );
  
  const renderJobsTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Jobs de Backup</h3>
      
      <div className="grid gap-4">
        {jobs.map((job) => {
          const JobIcon = getJobIcon(job.status);
          return (
            <div key={job.id} className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <JobIcon className={`w-5 h-5 ${
                    job.status === 'completed' ? 'text-green-500' :
                    job.status === 'failed' ? 'text-red-500' :
                    job.status === 'running' ? 'text-blue-500' :
                    'text-gray-500'
                  }`} />
                  <div>
                    <h4 className="font-semibold">{job.name}</h4>
                    <p className="text-sm text-gray-600">
                      {job.processedFiles}/{job.totalFiles} arquivos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {job.status === 'running' && (
                    <>
                      <button
                        onClick={() => pauseBackup(job.id)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Pausar"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => cancelBackup(job.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Cancelar"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {job.status === 'paused' && (
                    <button
                      onClick={() => resumeBackup(job.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Retomar"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Tamanho:</span>
                  <div className="text-gray-600">{formatFileSize(job.totalSize)}</div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Processado:</span>
                  <div className="text-gray-600">{formatFileSize(job.processedSize)}</div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Velocidade:</span>
                  <div className="text-gray-600">{formatFileSize(job.uploadSpeed)}/s</div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Tempo restante:</span>
                  <div className="text-gray-600">{formatDuration(job.estimatedTimeRemaining)}</div>
                </div>
              </div>
              
              {job.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Erros ({job.errors.length})
                  </div>
                  <div className="space-y-1">
                    {job.errors.slice(0, 3).map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        {error.error}
                      </div>
                    ))}
                    {job.errors.length > 3 && (
                      <div className="text-sm text-red-600">
                        +{job.errors.length - 3} mais erros
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {jobs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum job encontrado</p>
        </div>
      )}
    </div>
  );
  
  const renderConflictsTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Conflitos de Sincronização</h3>
      
      <div className="grid gap-4">
        {conflicts.map((conflict) => (
          <div key={conflict.id} className="bg-white p-6 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div>
                  <h4 className="font-semibold text-orange-800">{conflict.type}</h4>
                  <p className="text-sm text-gray-600">{conflict.description}</p>
                </div>
              </div>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                conflict.severity === 'high' ? 'bg-red-100 text-red-800' :
                conflict.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {conflict.severity}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">Versão Local</h5>
                <div className="text-sm text-blue-700">
                  <div>Versão: {conflict.localVersion.version}</div>
                  <div>Tamanho: {formatFileSize(conflict.localVersion.size)}</div>
                  <div>Criado: {new Date(conflict.localVersion.createdAt).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-800 mb-2">Versão na Nuvem</h5>
                <div className="text-sm text-green-700">
                  <div>Versão: {conflict.cloudVersion.version}</div>
                  <div>Tamanho: {formatFileSize(conflict.cloudVersion.size)}</div>
                  <div>Criado: {new Date(conflict.cloudVersion.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            {!conflict.resolution && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedConflict(conflict);
                    setShowConflictModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Resolver
                </button>
                
                <button
                  onClick={() => resolveConflict(conflict.id, 'local')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Usar Local
                </button>
                
                <button
                  onClick={() => resolveConflict(conflict.id, 'cloud')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Usar Nuvem
                </button>
              </div>
            )}
            
            {conflict.resolution && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Resolvido: {conflict.resolution}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {conflicts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum conflito encontrado</p>
        </div>
      )}
    </div>
  );
  
  const renderStatsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Estatísticas de Backup</h3>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Arquivos</p>
              <p className="text-2xl font-bold text-gray-900">{backupStats.totalFiles}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tamanho Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(backupStats.totalSize)}</p>
            </div>
            <HardDrive className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-gray-900">{backupStats.successRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{backupStats.activeJobs}</p>
            </div>
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-semibold mb-4">Arquivos por Tipo</h4>
          <div className="space-y-3">
            {Object.entries(backupStats.filesByType || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / backupStats.totalFiles) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-semibold mb-4">Jobs por Status</h4>
          <div className="space-y-3">
            {Object.entries(backupStats.jobsByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'completed' ? 'bg-green-600' :
                        status === 'failed' ? 'bg-red-600' :
                        status === 'running' ? 'bg-blue-600' :
                        'bg-gray-600'
                      }`}
                      style={{ width: `${(count / jobs.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configurações</h3>
      
      <div className="grid gap-6">
        {/* Configurações gerais */}
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-semibold mb-4">Geral</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Backup Automático</label>
                <p className="text-sm text-gray-600">Executar backups automaticamente</p>
              </div>
              <button
                onClick={() => toggleSetting('autoBackup')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.autoBackup ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Criptografia</label>
                <p className="text-sm text-gray-600">Criptografar arquivos antes do upload</p>
              </div>
              <button
                onClick={() => toggleSetting('encryptionEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.encryptionEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.encryptionEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Deduplicação</label>
                <p className="text-sm text-gray-600">Evitar duplicatas de arquivos</p>
              </div>
              <button
                onClick={() => toggleSetting('deduplicationEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.deduplicationEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.deduplicationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Configurações de performance */}
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-semibold mb-4">Performance</h4>
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Jobs Simultâneos: {config.maxConcurrentJobs}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={config.maxConcurrentJobs}
                onChange={(e) => updateConfig({ maxConcurrentJobs: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Nível de Compressão: {config.compressionLevel}
              </label>
              <input
                type="range"
                min="1"
                max="9"
                value={config.compressionLevel}
                onChange={(e) => updateConfig({ compressionLevel: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Tamanho do Chunk: {formatFileSize(config.chunkSize)}
              </label>
              <input
                type="range"
                min="512"
                max="10240"
                step="512"
                value={config.chunkSize / 1024}
                onChange={(e) => updateConfig({ chunkSize: parseInt(e.target.value) * 1024 })}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Ações */}
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-semibold mb-4">Ações</h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={cleanupOldVersions}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Versões Antigas
            </button>
            
            <button
              onClick={optimizeStorage}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Compress className="w-4 h-4" />
              Otimizar Armazenamento
            </button>
            
            <button
              onClick={() => verifyIntegrity()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileCheck className="w-4 h-4" />
              Verificar Integridade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Cloud className="w-8 h-8 text-blue-600" />
              Backup na Nuvem
            </h1>
            <p className="text-gray-600 mt-2">
              Sistema avançado de backup automático com sincronização inteligente
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isBackingUp && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <span className="text-sm font-medium">Fazendo backup...</span>
              </div>
            )}
            
            {isRestoring && (
              <div className="flex items-center gap-2 text-green-600">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Restaurando...</span>
              </div>
            )}
            
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <BarChart3 className="w-4 h-4" />
              Estatísticas
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'files', label: 'Arquivos', icon: FileText },
              { id: 'rules', label: 'Regras', icon: Target },
              { id: 'providers', label: 'Provedores', icon: Cloud },
              { id: 'jobs', label: 'Jobs', icon: Zap },
              { id: 'conflicts', label: 'Conflitos', icon: AlertTriangle, badge: conflicts.filter(c => !c.resolution).length },
              { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
              { id: 'settings', label: 'Configurações', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-1 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Conteúdo das tabs */}
      <div className="min-h-96">
        {activeTab === 'files' && renderFilesTab()}
        {activeTab === 'rules' && renderRulesTab()}
        {activeTab === 'providers' && renderProvidersTab()}
        {activeTab === 'jobs' && renderJobsTab()}
        {activeTab === 'conflicts' && renderConflictsTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
      
      {/* Modais */}
      {showAddFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Adicionar Arquivo</h3>
            <p className="text-gray-600 mb-4">
              Arquivo de demonstração será adicionado à lista.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAddFile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowAddFileModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Regra</h3>
            <p className="text-gray-600 mb-4">
              Regra de demonstração será criada.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAddRule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Criar
              </button>
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showAddProviderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Novo Provedor</h3>
            <p className="text-gray-600 mb-4">
              Provedor de demonstração será adicionado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAddProvider}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowAddProviderModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showConflictModal && selectedConflict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Resolver Conflito</h3>
            <p className="text-gray-600 mb-4">{selectedConflict.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Versão Local</h4>
                <div className="text-sm text-gray-600">
                  <div>Versão: {selectedConflict.localVersion.version}</div>
                  <div>Tamanho: {formatFileSize(selectedConflict.localVersion.size)}</div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Versão na Nuvem</h4>
                <div className="text-sm text-gray-600">
                  <div>Versão: {selectedConflict.cloudVersion.version}</div>
                  <div>Tamanho: {formatFileSize(selectedConflict.cloudVersion.size)}</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleResolveConflict('local')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Usar Local
              </button>
              <button
                onClick={() => handleResolveConflict('cloud')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Usar Nuvem
              </button>
              <button
                onClick={() => handleResolveConflict('merge')}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Mesclar
              </button>
              <button
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudBackupManager;