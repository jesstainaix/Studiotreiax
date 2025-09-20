import React, { useState, useEffect, useMemo } from 'react';
import { 
  useProjectVersioning, 
  useAutoVersioning, 
  useVersioningPerformance, 
  useVersioningStats, 
  useVersioningConfig, 
  useVersionComparison, 
  useVersioningDebug 
} from '../../hooks/useProjectVersioning';
import { 
  ProjectVersion, 
  ProjectBranch, 
  MergeRequest, 
  VersionComparison 
} from '../../utils/projectVersioning';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  History,
  Download,
  Upload,
  Settings,
  BarChart3,
  Bug,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Plus,
  Edit,
  Eye,
  Tag,
  Clock,
  User,
  FileText,
  Folder,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Save,
  X,
  Check,
  AlertTriangle,
  Info,
  Zap,
  Database,
  Activity,
  TrendingUp,
  Calendar,
  Hash,
  Code,
  Layers
} from 'lucide-react';

interface ProjectVersioningManagerProps {
  projectId?: string;
  className?: string;
}

const ProjectVersioningManager: React.FC<ProjectVersioningManagerProps> = ({ 
  projectId = 'default-project',
  className = '' 
}) => {
  // Hooks
  const versioning = useProjectVersioning({ 
    projectId, 
    autoLoad: true, 
    autoSave: true,
    enablePerformanceTracking: true 
  });
  const autoVersioning = useAutoVersioning({ 
    projectId, 
    autoSaveInterval: 300000,
    versionOnChange: true 
  });
  const { performance, trackOperation } = useVersioningPerformance();
  const { globalStats, projectStats } = useVersioningStats(projectId);
  const config = useVersioningConfig();
  const comparison = useVersionComparison();
  const debug = useVersioningDebug();
  
  // State
  const [activeTab, setActiveTab] = useState<'versions' | 'branches' | 'merges' | 'compare' | 'analytics' | 'config' | 'debug'>('versions');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<ProjectBranch | null>(null);
  const [selectedMergeRequest, setSelectedMergeRequest] = useState<MergeRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'version' | 'author'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Demo data generation
  const generateDemoVersions = async () => {
    const demoVersions = [
      { title: 'Initial Release', description: 'First stable version', status: 'stable' as const },
      { title: 'Feature Update', description: 'Added new features', status: 'beta' as const },
      { title: 'Bug Fixes', description: 'Critical bug fixes', status: 'stable' as const },
    ];
    
    for (const version of demoVersions) {
      await versioning.quickCreateVersion(version.title, version.description);
    }
  };
  
  const generateDemoBranches = async () => {
    const demoBranches = [
      { name: 'main', description: 'Main production branch' },
      { name: 'develop', description: 'Development branch' },
      { name: 'feature/new-ui', description: 'New UI implementation' },
    ];
    
    for (const branch of demoBranches) {
      await versioning.quickCreateBranch(branch.name, branch.description);
    }
  };
  
  const generateDemoMergeRequests = async () => {
    if (versioning.branches.length >= 2) {
      await versioning.quickMergeRequest(
        'Merge feature branch',
        versioning.branches[1].id,
        versioning.branches[0].id
      );
    }
  };
  
  // Filter and sort functions
  const filteredVersions = useMemo(() => {
    let filtered = versioning.projectVersions;
    
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => v.status === filterStatus);
    }
    
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
          break;
        case 'version':
          aValue = a.version;
          bValue = b.version;
          break;
        case 'author':
          aValue = a.author;
          bValue = b.author;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [versioning.projectVersions, searchTerm, filterStatus, sortBy, sortOrder]);
  
  const filteredBranches = useMemo(() => {
    let filtered = versioning.projectBranches;
    
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
  }, [versioning.projectBranches, searchTerm, sortOrder]);
  
  const filteredMergeRequests = useMemo(() => {
    let filtered = versioning.projectMergeRequests;
    
    if (searchTerm) {
      filtered = filtered.filter(mr => 
        mr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mr.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mr.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(mr => mr.status === filterStatus);
    }
    
    return filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.updatedAt.getTime() - b.updatedAt.getTime();
      } else {
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });
  }, [versioning.projectMergeRequests, searchTerm, filterStatus, sortOrder]);
  
  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'text-green-600 bg-green-100';
      case 'beta': return 'text-yellow-600 bg-yellow-100';
      case 'alpha': return 'text-orange-600 bg-orange-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'merged': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-red-600 bg-red-100';
      case 'conflict': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Project Versioning</h2>
              <p className="text-gray-600">Manage versions, branches, and project history</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={generateDemoVersions}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Demo Versions</span>
            </button>
            <button
              onClick={generateDemoBranches}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <GitBranch className="h-4 w-4" />
              <span>Demo Branches</span>
            </button>
            <button
              onClick={generateDemoMergeRequests}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <GitMerge className="h-4 w-4" />
              <span>Demo Merges</span>
            </button>
          </div>
        </div>
        
        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Versions</p>
                <p className="text-2xl font-bold text-blue-900">{versioning.projectVersions.length}</p>
              </div>
              <GitCommit className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Branches</p>
                <p className="text-2xl font-bold text-green-900">{versioning.projectBranches.length}</p>
              </div>
              <GitBranch className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Merge Requests</p>
                <p className="text-2xl font-bold text-purple-900">{versioning.projectMergeRequests.length}</p>
              </div>
              <GitPullRequest className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Comparisons</p>
                <p className="text-2xl font-bold text-orange-900">{versioning.comparisons.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'versions', label: 'Versions', icon: GitCommit },
            { id: 'branches', label: 'Branches', icon: GitBranch },
            { id: 'merges', label: 'Merge Requests', icon: GitPullRequest },
            { id: 'compare', label: 'Compare', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'config', label: 'Config', icon: Settings },
            { id: 'debug', label: 'Debug', icon: Bug },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Versions Tab */}
        {activeTab === 'versions' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search versions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="stable">Stable</option>
                  <option value="beta">Beta</option>
                  <option value="alpha">Alpha</option>
                  <option value="draft">Draft</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  <span>Sort</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowVersionModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Version</span>
              </button>
            </div>
            
            {/* Versions List */}
            <div className="space-y-4">
              {filteredVersions.map(version => (
                <div key={version.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{version.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(version.status)}`}>
                          {version.status}
                        </span>
                        <span className="text-sm text-gray-500">v{version.version}</span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{version.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{version.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{version.timestamp.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <GitBranch className="h-4 w-4" />
                          <span>{version.branch}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Database className="h-4 w-4" />
                          <span>{formatFileSize(version.size)}</span>
                        </div>
                      </div>
                      
                      {version.tags.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {version.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedVersion(version)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => versioning.restoreVersion(version.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Restore Version"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => versioning.deleteVersion(version.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Version"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredVersions.length === 0 && (
                <div className="text-center py-12">
                  <GitCommit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No versions found</h3>
                  <p className="text-gray-600 mb-4">Create your first version to get started</p>
                  <button
                    onClick={() => setShowVersionModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Version
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search branches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  <span>Sort</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowBranchModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Branch</span>
              </button>
            </div>
            
            {/* Branches List */}
            <div className="space-y-4">
              {filteredBranches.map(branch => (
                <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                        {branch.isProtected && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Protected
                          </span>
                        )}
                        {versioning.currentBranch === branch.id && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{branch.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{branch.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Created {branch.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RefreshCw className="h-4 w-4" />
                          <span>Updated {branch.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => versioning.switchBranch(branch.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Switch to Branch"
                      >
                        <GitBranch className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedBranch(branch)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Branch"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!branch.isProtected && (
                        <button
                          onClick={() => versioning.deleteBranch(branch.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Branch"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredBranches.length === 0 && (
                <div className="text-center py-12">
                  <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
                  <p className="text-gray-600 mb-4">Create your first branch to get started</p>
                  <button
                    onClick={() => setShowBranchModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Branch
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Merge Requests Tab */}
        {activeTab === 'merges' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search merge requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="merged">Merged</option>
                  <option value="closed">Closed</option>
                  <option value="conflict">Conflict</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  <span>Sort</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowMergeModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Merge Request</span>
              </button>
            </div>
            
            {/* Merge Requests List */}
            <div className="space-y-4">
              {filteredMergeRequests.map(mergeRequest => (
                <div key={mergeRequest.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{mergeRequest.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mergeRequest.status)}`}>
                          {mergeRequest.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{mergeRequest.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{mergeRequest.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Updated {mergeRequest.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <GitBranch className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">
                            {versioning.getBranch(mergeRequest.sourceBranch)?.name || 'Unknown'}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium">
                            {versioning.getBranch(mergeRequest.targetBranch)?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      
                      {mergeRequest.conflicts.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-red-800 font-medium">Conflicts ({mergeRequest.conflicts.length})</span>
                          </div>
                          <div className="space-y-1">
                            {mergeRequest.conflicts.slice(0, 3).map(conflict => (
                              <div key={conflict.id} className="text-sm text-red-700">
                                {conflict.file}: {conflict.description}
                              </div>
                            ))}
                            {mergeRequest.conflicts.length > 3 && (
                              <div className="text-sm text-red-600">
                                +{mergeRequest.conflicts.length - 3} more conflicts
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedMergeRequest(mergeRequest)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {mergeRequest.status === 'open' && (
                        <>
                          <button
                            onClick={() => versioning.resolveMergeRequest(mergeRequest.id, 'merge')}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Merge"
                          >
                            <GitMerge className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => versioning.resolveMergeRequest(mergeRequest.id, 'close')}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredMergeRequests.length === 0 && (
                <div className="text-center py-12">
                  <GitPullRequest className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No merge requests found</h3>
                  <p className="text-gray-600 mb-4">Create your first merge request to get started</p>
                  <button
                    onClick={() => setShowMergeModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create Merge Request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Version Comparison</h3>
              <button
                onClick={() => setShowCompareModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>New Comparison</span>
              </button>
            </div>
            
            {/* Comparisons List */}
            <div className="space-y-4">
              {versioning.comparisons.map(comp => (
                <div key={comp.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {versioning.getVersion(comp.fromVersionId)?.title} → {versioning.getVersion(comp.toVersionId)?.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created {comp.createdAt.toLocaleDateString()}</span>
                        <span>{comp.changes.length} changes</span>
                      </div>
                    </div>
                    <button
                      onClick={() => comparison.setActiveComparison(comp.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                  
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-green-800 font-semibold">
                        {comp.changes.filter(c => c.type === 'added').length}
                      </div>
                      <div className="text-green-600">Added</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-yellow-800 font-semibold">
                        {comp.changes.filter(c => c.type === 'modified').length}
                      </div>
                      <div className="text-yellow-600">Modified</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-red-800 font-semibold">
                        {comp.changes.filter(c => c.type === 'deleted').length}
                      </div>
                      <div className="text-red-600">Deleted</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {versioning.comparisons.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No comparisons found</h3>
                  <p className="text-gray-600 mb-4">Compare versions to see differences</p>
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Create Comparison
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Analytics &amp; Statistics</h3>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Versions</p>
                    <p className="text-2xl font-bold text-blue-900">{globalStats.totalVersions}</p>
                  </div>
                  <GitCommit className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Total Branches</p>
                    <p className="text-2xl font-bold text-green-900">{globalStats.totalBranches}</p>
                  </div>
                  <GitBranch className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Total Merges</p>
                    <p className="text-2xl font-bold text-purple-900">{globalStats.totalMergeRequests}</p>
                  </div>
                  <GitMerge className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Storage Used</p>
                    <p className="text-2xl font-bold text-orange-900">{formatFileSize(globalStats.totalSize)}</p>
                  </div>
                  <Database className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatDuration(performance.saveTime)}</div>
                  <div className="text-sm text-gray-600">Avg Save Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatDuration(performance.loadTime)}</div>
                  <div className="text-sm text-gray-600">Avg Load Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatDuration(performance.compareTime)}</div>
                  <div className="text-sm text-gray-600">Avg Compare Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{performance.operationsPerSecond.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Ops/Second</div>
                </div>
              </div>
            </div>
            
            {/* Project Stats */}
            {projectStats && (
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">{projectStats.versions}</div>
                    <div className="text-sm text-blue-600">Versions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">{projectStats.branches}</div>
                    <div className="text-sm text-green-600">Branches</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900">{projectStats.mergeRequests}</div>
                    <div className="text-sm text-purple-600">Merge Requests</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => versioning.exportProject('json')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <button
                  onClick={() => document.getElementById('import-file')?.click()}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                </button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json,.zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      versioning.importProject(file);
                    }
                  }}
                />
                <button
                  onClick={config.resetConfig}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
            
            {/* Configuration Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Settings */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Auto Save</label>
                    <button
                      onClick={config.toggleAutoSave}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.config.autoSave ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.config.autoSave ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Compression</label>
                    <button
                      onClick={config.toggleCompression}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.config.compressionEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.config.compressionEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Auto Backup</label>
                    <button
                      onClick={config.toggleBackup}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.config.backupEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.config.backupEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Storage Settings */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Storage Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Versions: {config.config.maxVersions}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      value={config.config.maxVersions}
                      onChange={(e) => config.setMaxVersions(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retention Days: {config.config.retentionDays}
                    </label>
                    <input
                      type="range"
                      min="7"
                      max="365"
                      value={config.config.retentionDays}
                      onChange={(e) => config.setRetentionDays(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Current Configuration */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Configuration</h4>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(config.config, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Debug Information</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={debug.exportDebugData}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Debug</span>
                </button>
                <button
                  onClick={debug.clearData}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Data</span>
                </button>
              </div>
            </div>
            
            {/* System Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">System Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Store Size:</span>
                    <span className="font-medium">
                      V:{debug.debugInfo.storeSize.versions} B:{debug.debugInfo.storeSize.branches} M:{debug.debugInfo.storeSize.mergeRequests}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Project:</span>
                    <span className="font-medium">{debug.debugInfo.currentState.project || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Branch:</span>
                    <span className="font-medium">{debug.debugInfo.currentState.branch || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loading:</span>
                    <span className={`font-medium ${debug.debugInfo.isLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                      {debug.debugInfo.isLoading ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error:</span>
                    <span className={`font-medium ${debug.debugInfo.error ? 'text-red-600' : 'text-green-600'}`}>
                      {debug.debugInfo.error || 'None'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Save Time:</span>
                    <span className="font-medium">{formatDuration(debug.debugInfo.performance.saveTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Load Time:</span>
                    <span className="font-medium">{formatDuration(debug.debugInfo.performance.loadTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compare Time:</span>
                    <span className="font-medium">{formatDuration(debug.debugInfo.performance.compareTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage Used:</span>
                    <span className="font-medium">{formatFileSize(debug.debugInfo.performance.storageUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cache Hit Rate:</span>
                    <span className="font-medium">{debug.debugInfo.performance.cacheHitRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Debug Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={debug.runDiagnostics}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Activity className="h-4 w-4" />
                  <span>Run Diagnostics</span>
                </button>
                <button
                  onClick={debug.validateData}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Validate Data</span>
                </button>
                <button
                  onClick={debug.optimizeStorage}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>Optimize Storage</span>
                </button>
                <button
                  onClick={debug.repairData}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Repair Data</span>
                </button>
              </div>
            </div>
            
            {/* Debug Logs */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Debug Logs</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {debug.debugInfo.logs.length > 0 ? (
                  debug.debugInfo.logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span>
                      <span className={`ml-2 ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warn' ? 'text-yellow-400' :
                        log.level === 'info' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="ml-2">{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No logs available</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectVersioningManager;