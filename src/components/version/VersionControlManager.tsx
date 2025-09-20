import React, { useState, useMemo } from 'react';
import { 
  GitBranch, GitCommit, GitMerge, GitPullRequest, GitCompare,
  Clock, User, FileText, Plus, Minus, Edit3, Eye, Settings,
  Search, Filter, RefreshCw, Download, Upload, Trash2,
  CheckCircle, XCircle, AlertCircle, Info, Play, Pause,
  ChevronDown, ChevronRight, Code, History, Tag, Star,
  Zap, Target, TrendingUp, Activity, BarChart3, PieChart
} from 'lucide-react';
import { useVersionControl } from '../../hooks/useVersionControl';
import { Version, Branch, MergeRequest, VersionDiff, FileChange } from '../../services/versionControlService';

const VersionControlManager: React.FC = () => {
  // State Management
  const {
    versions,
    branches,
    mergeRequests,
    currentBranch,
    currentVersion,
    selectedVersions,
    isLoading,
    error,
    filter,
    searchQuery,
    config,
    stats,
    events,
    filteredVersions,
    versionTree,
    conflictCount,
    pendingChanges,
    progress,
    isProgressActive,
    autoRefresh,
    
    // Actions
    createVersion,
    updateVersion,
    deleteVersion,
    revertVersion,
    compareVersions,
    createBranch,
    switchBranch,
    mergeBranch,
    deleteBranch,
    createMergeRequest,
    reviewMergeRequest,
    mergeMergeRequest,
    resolveConflict,
    autoResolveConflicts,
    
    // Helpers
    quickActions,
    advancedFeatures,
    systemOperations,
    utilities,
    configHelpers,
    analyticsHelpers,
    searchHelpers,
    realTimeHelpers,
    
    // Computed
    hasVersions,
    hasBranches,
    hasMergeRequests,
    hasConflicts,
    hasPendingChanges,
    totalCommits,
    totalAuthors,
    totalBranches,
    currentBranchInfo,
    latestVersion,
    filteredCount,
    isFiltered
  } = useVersionControl();
  
  // Local State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedMergeRequest, setSelectedMergeRequest] = useState<MergeRequest | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[string, string] | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set(['main']));
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'timeline'>('tree');
  
  // Demo Data Generation Effect
  React.useEffect(() => {
    // Demo data is generated in the hook
  }, []);
  
  // Filtered and Sorted Data
  const sortedVersions = useMemo(() => {
    return [...filteredVersions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [filteredVersions]);
  
  const sortedBranches = useMemo(() => {
    return [...branches].sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return b.lastCommit.localeCompare(a.lastCommit);
    });
  }, [branches]);
  
  const sortedMergeRequests = useMemo(() => {
    return [...mergeRequests].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [mergeRequests]);
  
  // Status Cards Data
  const statusCards = [
    {
      title: 'Total de Commits',
      value: totalCommits.toLocaleString(),
      icon: GitCommit,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Branches Ativas',
      value: totalBranches.toString(),
      icon: GitBranch,
      color: 'bg-green-500',
      change: '+2',
      trend: 'up'
    },
    {
      title: 'Merge Requests',
      value: mergeRequests.length.toString(),
      icon: GitPullRequest,
      color: 'bg-purple-500',
      change: '+5',
      trend: 'up'
    },
    {
      title: 'Conflitos',
      value: conflictCount.toString(),
      icon: AlertCircle,
      color: conflictCount > 0 ? 'bg-red-500' : 'bg-gray-500',
      change: conflictCount > 0 ? 'Atenção' : 'OK',
      trend: conflictCount > 0 ? 'down' : 'neutral'
    }
  ];
  
  // Tab Configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'versions', label: 'Versões', icon: GitCommit },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'merges', label: 'Merge Requests', icon: GitPullRequest },
    { id: 'conflicts', label: 'Conflitos', icon: AlertCircle },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Toggle Branch Expansion
  const toggleBranchExpansion = (branchName: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchName)) {
      newExpanded.delete(branchName);
    } else {
      newExpanded.add(branchName);
    }
    setExpandedBranches(newExpanded);
  };
  
  // Render Version Tree
  const renderVersionTree = () => {
    return (
      <div className="space-y-4">
        {Object.entries(versionTree).map(([branchName, branchVersions]) => {
          const isExpanded = expandedBranches.has(branchName);
          const branch = branches.find(b => b.name === branchName);
          
          return (
            <div key={branchName} className="border rounded-lg">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleBranchExpansion(branchName)}
              >
                <div className="flex items-center space-x-3">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <GitBranch className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">{branchName}</span>
                  {branch?.isDefault && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Principal
                    </span>
                  )}
                  {branch?.isProtected && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Protegida
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{(branchVersions as Version[]).length} commits</span>
                  {branch && (
                    <span className="text-xs">
                      {new Date(branch.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t bg-gray-50">
                  <div className="p-4 space-y-2">
                    {(branchVersions as Version[]).map((version, index) => (
                      <div 
                        key={version.id}
                        className="flex items-center justify-between p-3 bg-white rounded border hover:shadow-sm cursor-pointer"
                        onClick={() => setSelectedVersion(version)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <GitCommit className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">{version.name}</div>
                            <div className="text-xs text-gray-500">
                              {version.commitHash.substring(0, 8)} • {version.author}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            version.status === 'committed' ? 'bg-green-100 text-green-800' :
                            version.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            version.status === 'merged' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {version.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(version.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render Version List
  const renderVersionList = () => {
    return (
      <div className="space-y-2">
        {sortedVersions.map((version) => (
          <div 
            key={version.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm cursor-pointer"
            onClick={() => setSelectedVersion(version)}
          >
            <div className="flex items-center space-x-4">
              <GitCommit className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium">{version.name}</div>
                <div className="text-sm text-gray-500">{version.description}</div>
                <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                  <span>{version.commitHash.substring(0, 8)}</span>
                  <span>{version.author}</span>
                  <span>{version.branchName}</span>
                  <span>{new Date(version.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right text-sm">
                <div className="text-green-600">+{version.metadata.linesAdded}</div>
                <div className="text-red-600">-{version.metadata.linesDeleted}</div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                version.status === 'committed' ? 'bg-green-100 text-green-800' :
                version.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                version.status === 'merged' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {version.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render Timeline View
  const renderTimeline = () => {
    return (
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-6">
          {sortedVersions.map((version, index) => (
            <div key={version.id} className="relative flex items-start space-x-4">
              <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
                <GitCommit className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{version.name}</h3>
                    <p className="text-sm text-gray-500">{version.description}</p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(version.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <span>{version.commitHash.substring(0, 8)}</span>
                  <span>{version.author}</span>
                  <span>{version.branchName}</span>
                  <span className="text-green-600">+{version.metadata.linesAdded}</span>
                  <span className="text-red-600">-{version.metadata.linesDeleted}</span>
                </div>
                {version.fileChanges.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">
                      {version.fileChanges.length} arquivo(s) modificado(s)
                    </div>
                    <div className="space-y-1">
                      {version.fileChanges.slice(0, 3).map((file) => (
                        <div key={file.id} className="flex items-center space-x-2 text-xs">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{file.fileName}</span>
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            file.changeType === 'added' ? 'bg-green-100 text-green-800' :
                            file.changeType === 'modified' ? 'bg-blue-100 text-blue-800' :
                            file.changeType === 'deleted' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {file.changeType}
                          </span>
                        </div>
                      ))}
                      {version.fileChanges.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{version.fileChanges.length - 3} mais arquivo(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">Controle de Versões</h1>
          </div>
          {currentBranchInfo && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
              <GitBranch className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">{currentBranch}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => realTimeHelpers.setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
              autoRefresh 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="text-sm">Auto Sync</span>
          </button>
          
          {/* Manual Refresh */}
          <button
            onClick={() => realTimeHelpers.refresh()}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Atualizar</span>
          </button>
          
          {/* Quick Actions */}
          <button
            onClick={() => setShowVersionModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Novo Commit</span>
          </button>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      {isProgressActive && (
        <div className="mx-6 mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-gray-600">Carregando dados do controle de versões...</span>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <span className={`text-sm ${
                      card.trend === 'up' ? 'text-green-600' :
                      card.trend === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.id === 'conflicts' && conflictCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {conflictCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <span>Atividade Recente</span>
                </h3>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm">{event.message}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span>Estatísticas</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Linhas Adicionadas</span>
                    <span className="font-medium text-green-600">+{stats.totalLinesAdded.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Linhas Removidas</span>
                    <span className="font-medium text-red-600">-{stats.totalLinesDeleted.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arquivos Modificados</span>
                    <span className="font-medium">{stats.totalFilesModified.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tamanho Médio do Commit</span>
                    <span className="font-medium">{Math.round(stats.averageCommitSize)} linhas</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Ações Rápidas</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <GitCommit className="w-6 h-6 text-blue-500" />
                  <span className="text-sm font-medium">Novo Commit</span>
                </button>
                <button
                  onClick={() => setShowBranchModal(true)}
                  className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <GitBranch className="w-6 h-6 text-green-500" />
                  <span className="text-sm font-medium">Nova Branch</span>
                </button>
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <GitMerge className="w-6 h-6 text-purple-500" />
                  <span className="text-sm font-medium">Merge Request</span>
                </button>
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <GitCompare className="w-6 h-6 text-orange-500" />
                  <span className="text-sm font-medium">Comparar</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'versions' && (
          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar versões..."
                    value={searchQuery}
                    onChange={(e) => searchHelpers.setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="flex items-center space-x-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filtros</span>
                </button>
                {isFiltered && (
                  <button
                    onClick={searchHelpers.clearAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {filteredCount} de {versions.length} versões
                </span>
                <div className="flex border rounded-lg">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`p-2 ${viewMode === 'tree' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                  >
                    <GitBranch className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`p-2 ${viewMode === 'timeline' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Version Views */}
            {viewMode === 'tree' && renderVersionTree()}
            {viewMode === 'list' && renderVersionList()}
            {viewMode === 'timeline' && renderTimeline()}
          </div>
        )}
        
        {activeTab === 'branches' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Gerenciar Branches</h2>
              <button
                onClick={() => setShowBranchModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Branch</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {sortedBranches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm">
                  <div className="flex items-center space-x-4">
                    <GitBranch className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{branch.name}</span>
                        {branch.isDefault && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Principal
                          </span>
                        )}
                        {branch.isProtected && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Protegida
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{branch.description}</div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>{branch.author}</span>
                        <span>{new Date(branch.createdAt).toLocaleDateString()}</span>
                        <span>{branch.ahead} à frente, {branch.behind} atrás</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentBranch !== branch.name && (
                      <button
                        onClick={() => switchBranch(branch.name)}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >
                        Trocar
                      </button>
                    )}
                    {currentBranch === branch.name && (
                      <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                        Atual
                      </span>
                    )}
                    {!branch.isDefault && !branch.isProtected && (
                      <button
                        onClick={() => deleteBranch(branch.name)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'merges' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Merge Requests</h2>
              <button
                onClick={() => setShowMergeModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Merge Request</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {sortedMergeRequests.map((mr) => (
                <div key={mr.id} className="border rounded-lg p-4 hover:shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <GitPullRequest className="w-5 h-5 text-purple-500" />
                      <div>
                        <h3 className="font-medium">{mr.title}</h3>
                        <p className="text-sm text-gray-500">{mr.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      mr.status === 'open' ? 'bg-green-100 text-green-800' :
                      mr.status === 'merged' ? 'bg-blue-100 text-blue-800' :
                      mr.status === 'closed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {mr.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>{mr.author}</span>
                      <span>{mr.sourceBranch} → {mr.targetBranch}</span>
                      <span>{new Date(mr.createdAt).toLocaleDateString()}</span>
                      {mr.conflicts.length > 0 && (
                        <span className="text-red-600">
                          {mr.conflicts.length} conflito(s)
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{mr.approvals.length}</span>
                      </div>
                      {mr.status === 'open' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => reviewMergeRequest(mr.id, true)}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => mergeMergeRequest(mr.id)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Merge
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'conflicts' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span>Resolução de Conflitos</span>
                {conflictCount > 0 && (
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                    {conflictCount}
                  </span>
                )}
              </h2>
              {conflictCount > 0 && (
                <button
                  onClick={() => autoResolveConflicts('ours')}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <Target className="w-4 h-4" />
                  <span>Auto-resolver</span>
                </button>
              )}
            </div>
            
            {conflictCount === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum conflito encontrado</h3>
                <p className="text-gray-500">Todas as mudanças foram mescladas com sucesso.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mergeRequests
                  .filter(mr => mr.conflicts.length > 0)
                  .map((mr) => (
                    <div key={mr.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{mr.title}</h3>
                          <p className="text-sm text-gray-500">
                            {mr.sourceBranch} → {mr.targetBranch}
                          </p>
                        </div>
                        <span className="text-sm text-red-600">
                          {mr.conflicts.length} conflito(s)
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {mr.conflicts.map((conflict) => (
                          <div key={conflict.id} className="border rounded p-3 bg-red-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-red-500" />
                                <span className="font-medium">{conflict.filePath}</span>
                                <span className="text-sm text-gray-500">
                                  Linha {conflict.lineNumber}
                                </span>
                              </div>
                              {!conflict.resolved && (
                                <button
                                  onClick={() => resolveConflict(conflict.id, conflict.localContent)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                >
                                  Resolver
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-green-700 mb-1">Local (Seu):</div>
                                <div className="bg-green-50 p-2 rounded border">
                                  <code>{conflict.localContent}</code>
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-red-700 mb-1">Remoto (Deles):</div>
                                <div className="bg-red-50 p-2 rounded border">
                                  <code>{conflict.remoteContent}</code>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Analytics e Relatórios</h2>
            
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Top Autores</span>
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.byAuthor)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([author, commits]) => (
                      <div key={author} className="flex justify-between">
                        <span className="text-sm">{author}</span>
                        <span className="text-sm font-medium">{commits}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-green-500" />
                  <span>Top Branches</span>
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.byBranch)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([branch, commits]) => (
                      <div key={branch} className="flex justify-between">
                        <span className="text-sm">{branch}</span>
                        <span className="text-sm font-medium">{commits}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span>Arquivos Mais Ativos</span>
                </h3>
                <div className="space-y-2">
                  {stats.mostActiveFiles.slice(0, 5).map((file, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm truncate">{file.path}</span>
                      <span className="text-sm font-medium">{file.changes}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Export Options */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-medium mb-4 flex items-center space-x-2">
                <Download className="w-4 h-4 text-blue-500" />
                <span>Exportar Dados</span>
              </h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => systemOperations.export('json')}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Exportar JSON
                </button>
                <button
                  onClick={() => systemOperations.export('csv')}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Exportar CSV
                </button>
                <button
                  onClick={() => systemOperations.export('git')}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Exportar Git
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Configurações</h2>
            
            {/* General Settings */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-medium mb-4">Configurações Gerais</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Auto Save</label>
                    <p className="text-sm text-gray-500">Salvar automaticamente as mudanças</p>
                  </div>
                  <button
                    onClick={configHelpers.toggleAutoSave}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.autoSave ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.autoSave ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Real-time Sync</label>
                    <p className="text-sm text-gray-500">Sincronização em tempo real</p>
                  </div>
                  <button
                    onClick={configHelpers.toggleRealTimeSync}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.realTimeSync ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.realTimeSync ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div>
                  <label className="block font-medium mb-2">Algoritmo de Diff</label>
                  <select
                    value={config.diffAlgorithm}
                    onChange={(e) => configHelpers.updateConfig({ diffAlgorithm: e.target.value as any })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="myers">Myers</option>
                    <option value="patience">Patience</option>
                    <option value="histogram">Histogram</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-medium mb-2">Linhas de Contexto</label>
                  <input
                    type="number"
                    value={config.contextLines}
                    onChange={(e) => configHelpers.updateConfig({ contextLines: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                  />
                </div>
                
                <div>
                  <label className="block font-medium mb-2">Máximo de Histórico</label>
                  <input
                    type="number"
                    value={config.maxVersionHistory}
                    onChange={(e) => configHelpers.updateConfig({ maxVersionHistory: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="100"
                    max="10000"
                    step="100"
                  />
                </div>
              </div>
            </div>
            
            {/* System Operations */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-medium mb-4">Operações do Sistema</h3>
              <div className="space-y-4">
                <button
                  onClick={() => systemOperations.optimize()}
                  className="w-full flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Target className="w-4 h-4" />
                  <span>Otimizar Armazenamento</span>
                </button>
                
                <button
                  onClick={() => systemOperations.repair()}
                  className="w-full flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  <span>Reparar Corrupção</span>
                </button>
                
                <button
                  onClick={configHelpers.resetConfig}
                  className="w-full flex items-center justify-center space-x-2 p-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restaurar Padrões</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modals would be implemented here */}
      {/* Version Modal, Branch Modal, Merge Modal, Compare Modal, Conflict Modal */}
    </div>
  );
};

export default VersionControlManager;