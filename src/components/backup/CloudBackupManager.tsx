import React, { useState, useEffect } from 'react';
import {
  useCloudBackup,
  useAutoBackup,
  useBackupPerformance,
  useBackupStats,
  useBackupConfig,
  useBackupSync,
  useBackupDebug
} from '../../hooks/useCloudBackup';
import {
  Cloud,
  Upload,
  Download,
  Trash2,
  Settings,
  BarChart3,
  Activity,
  Bug,
  Plus,
  Edit,
  Copy,
  RefreshCw,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  HardDrive,
  Zap,
  Shield,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Eye,
  FileText,
  Folder,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { formatFileSize, getProviderIcon, getBackupTypeColor } from '../../utils/cloudBackup';

const CloudBackupManager: React.FC = () => {
  // Hooks
  const backup = useCloudBackup({ autoInit: true, enableAutoBackup: true });
  const autoBackup = useAutoBackup({ enabled: true, interval: 30 });
  const performance = useBackupPerformance();
  const stats = useBackupStats();
  const config = useBackupConfig();
  const sync = useBackupSync();
  const debug = useBackupDebug();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedBackups, setSelectedBackups] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'auto' | 'scheduled'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<'timestamp' | 'size' | 'name'>('timestamp');
  
  // Demo data generation
  const generateDemoProvider = () => {
    const types = ['aws', 'gcp', 'azure', 'dropbox', 'gdrive'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    backup.addProvider({
      name: `${type.toUpperCase()} Storage`,
      type,
      endpoint: `https://${type}.example.com`,
      credentials: { apiKey: 'demo-key' },
      quota: {
        used: Math.floor(Math.random() * 500000000),
        total: 1000000000
      }
    });
  };
  
  const generateDemoBackups = async () => {
    const descriptions = [
      'Project milestone backup',
      'Before major refactor',
      'Weekly backup',
      'Pre-deployment backup',
      'Feature complete backup'
    ];
    
    for (const description of descriptions) {
      await backup.createBackup(description, 'manual');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };
  
  // Filtered and sorted backups
  const filteredBackups = backup.versions
    .filter(version => {
      const matchesSearch = version.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || version.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'name':
          comparison = a.description.localeCompare(b.description);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total Backups',
      value: backup.versions.length.toString(),
      icon: Database,
      color: 'blue',
      trend: '+12%'
    },
    {
      title: 'Storage Used',
      value: formatFileSize(backup.totalStorageUsed),
      icon: HardDrive,
      color: 'green',
      trend: '+5%'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'emerald',
      trend: '+2%'
    },
    {
      title: 'Sync Status',
      value: sync.isActive ? 'Active' : 'Idle',
      icon: sync.isActive ? RefreshCw : Clock,
      color: sync.isActive ? 'orange' : 'gray',
      trend: sync.isActive ? 'Syncing...' : 'Ready'
    }
  ];
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'providers', label: 'Providers', icon: Cloud },
    { id: 'backups', label: 'Backups', icon: Database },
    { id: 'sync', label: 'Sync', icon: RefreshCw },
    { id: 'config', label: 'Config', icon: Settings },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'debug', label: 'Debug', icon: Bug }
  ];
  
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Cloud className="w-8 h-8 text-blue-500" />
            Cloud Backup Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your cloud backups, sync data, and monitor performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            backup.isConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {backup.isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {backup.isConnected ? 'Connected' : 'Disconnected'}
          </div>
          
          <button
            onClick={generateDemoProvider}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Provider
          </button>
          
          <button
            onClick={generateDemoBackups}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Demo Backups
          </button>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600 dark:text-${card.color}-400`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  card.trend.startsWith('+') 
                    ? 'text-green-600 dark:text-green-400'
                    : card.trend.includes('Syncing')
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {card.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Backups */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Backups</h3>
                  <div className="space-y-3">
                    {backup.recentBackups.slice(0, 5).map((version) => (
                      <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full bg-${getBackupTypeColor(version.type)}-500`} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{version.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(version.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatFileSize(version.size)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {version.type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Storage Usage */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Storage Usage</h3>
                  <div className="space-y-4">
                    {backup.activeProvider && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {backup.activeProvider.name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(backup.storageUsage.used)} / {formatFileSize(backup.storageUsage.used + backup.storageUsage.available)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(backup.storageUsage.used / (backup.storageUsage.used + backup.storageUsage.available)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {backup.versions.length}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Backups</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatFileSize(backup.compressionSavings)}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">Space Saved</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => backup.quickBackup()}
                    disabled={!backup.hasActiveProvider}
                    className="flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    Quick Backup
                  </button>
                  
                  <button
                    onClick={() => sync.startSync()}
                    disabled={!sync.canSync}
                    className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Sync Now
                  </button>
                  
                  <button
                    onClick={() => backup.autoCleanup()}
                    className="flex items-center justify-center gap-2 p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Cleanup
                  </button>
                  
                  <button
                    onClick={() => backup.optimizeStorage()}
                    className="flex items-center justify-center gap-2 p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Zap className="w-5 h-5" />
                    Optimize
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Providers Tab */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cloud Providers</h3>
                <button
                  onClick={() => setShowProviderModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Provider
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {backup.providers.map((provider) => (
                  <div key={provider.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getProviderIcon(provider.type)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{provider.type}</p>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        provider.isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Storage Used</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatFileSize(provider.quota.used)} / {formatFileSize(provider.quota.total)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(provider.quota.used / provider.quota.total) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => backup.setActiveProvider(provider.id)}
                        disabled={provider.id === backup.activeProvider?.id}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {provider.id === backup.activeProvider?.id ? 'Active' : 'Set Active'}
                      </button>
                      
                      <button
                        onClick={() => backup.testConnection(provider.id)}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        Test
                      </button>
                      
                      <button
                        onClick={() => backup.removeProvider(provider.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Backups Tab */}
          {activeTab === 'backups' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search backups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="manual">Manual</option>
                  <option value="auto">Auto</option>
                  <option value="scheduled">Scheduled</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="timestamp">Date</option>
                  <option value="size">Size</option>
                  <option value="name">Name</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => setShowBackupModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Backup
                </button>
              </div>
              
              {/* Backups List */}
              <div className="space-y-3">
                {filteredBackups.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedBackups.includes(version.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBackups([...selectedBackups, version.id]);
                          } else {
                            setSelectedBackups(selectedBackups.filter(id => id !== version.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      
                      <div className={`w-3 h-3 rounded-full bg-${getBackupTypeColor(version.type)}-500`} />
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{version.description}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{new Date(version.timestamp).toLocaleString()}</span>
                          <span>{formatFileSize(version.size)}</span>
                          <span className="capitalize">{version.type}</span>
                          <span>{version.files.length} files</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => backup.quickRestore(version.id)}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Restore
                      </button>
                      
                      <button
                        onClick={() => backup.duplicateBackup(version.id, `Copy of ${version.description}`)}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      
                      <button
                        onClick={() => backup.deleteBackup(version.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Bulk Actions */}
              {selectedBackups.length > 0 && (
                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedBackups.length} backup(s) selected
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        selectedBackups.forEach(id => backup.deleteBackup(id));
                        setSelectedBackups([]);
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </button>
                    
                    {selectedBackups.length === 2 && (
                      <button
                        onClick={() => {
                          backup.compareBackups(selectedBackups[0], selectedBackups[1]);
                          setShowCompareModal(true);
                        }}
                        className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Compare
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Sync Tab */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sync Status</h3>
                
                <div className="flex items-center gap-2">
                  {sync.isActive ? (
                    <>
                      <button
                        onClick={sync.pauseSync}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                      
                      <button
                        onClick={sync.stopSync}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Square className="w-4 h-4" />
                        Stop
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={sync.startSync}
                        disabled={!sync.canSync}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start Sync
                      </button>
                      
                      <button
                        onClick={sync.forceSync}
                        disabled={!sync.canSync}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Force Sync
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Sync Progress */}
              {sync.isActive && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Sync Progress</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {sync.syncProgress.percentage}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${sync.syncProgress.percentage}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Current File</p>
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {sync.syncProgress.currentFile || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Files Processed</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {sync.syncProgress.filesProcessed} / {sync.syncProgress.totalFiles}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Speed</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatFileSize(sync.syncProgress.speed)}/s
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">ETA</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {sync.syncProgress.eta > 0 ? `${Math.round(sync.syncProgress.eta)}s` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sync Errors */}
              {sync.syncProgress.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900 rounded-lg p-6">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Sync Errors
                  </h4>
                  <div className="space-y-2">
                    {sync.syncProgress.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-800 dark:text-red-200">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Auto Backup Status */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Auto Backup</h4>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    autoBackup.isEnabled
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {autoBackup.isEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Interval</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {autoBackup.interval} minutes
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Last Backup</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {backup.stats.lastBackup 
                        ? new Date(backup.stats.lastBackup).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Config Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Backup Configuration</h3>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const configData = config.exportConfig();
                      navigator.clipboard.writeText(configData);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Export
                  </button>
                  
                  <button
                    onClick={config.resetConfig}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">General Settings</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Auto Backup
                      </label>
                      <button
                        onClick={config.toggleAutoBackup}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.config.autoBackup ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.config.autoBackup ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Backup Interval (minutes)
                      </label>
                      <input
                        type="number"
                        value={config.config.backupInterval}
                        onChange={(e) => config.updateSetting('backupInterval', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="1440"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Versions
                      </label>
                      <input
                        type="number"
                        value={config.config.maxVersions}
                        onChange={(e) => config.updateSetting('maxVersions', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Retention Days
                      </label>
                      <input
                        type="number"
                        value={config.config.retentionDays}
                        onChange={(e) => config.updateSetting('retentionDays', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="365"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Advanced Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Advanced Settings</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Encryption
                      </label>
                      <button
                        onClick={config.toggleEncryption}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.config.encryptionEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.config.encryptionEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sync on Change
                      </label>
                      <button
                        onClick={config.toggleSyncOnChange}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.config.syncOnChange ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.config.syncOnChange ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Compression Level (0-9)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="9"
                        value={config.config.compressionLevel}
                        onChange={(e) => config.updateSetting('compressionLevel', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Fast</span>
                        <span className="font-medium">{config.config.compressionLevel}</span>
                        <span>Best</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Conflict Resolution
                      </label>
                      <select
                        value={config.config.conflictResolution}
                        onChange={(e) => config.updateSetting('conflictResolution', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="local">Prefer Local</option>
                        <option value="remote">Prefer Remote</option>
                        <option value="merge">Auto Merge</option>
                        <option value="ask">Ask User</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* File Patterns */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">File Patterns</h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Include Patterns
                    </label>
                    <textarea
                      value={config.config.includePatterns.join('\n')}
                      onChange={(e) => config.updateSetting('includePatterns', e.target.value.split('\n').filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="src/**\n*.json\n*.md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exclude Patterns
                    </label>
                    <textarea
                      value={config.config.excludePatterns.join('\n')}
                      onChange={(e) => config.updateSetting('excludePatterns', e.target.value.split('\n').filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="node_modules\n.git\n*.tmp\n*.log"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={performance.startMeasurement}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Measure
                  </button>
                  
                  <button
                    onClick={performance.optimize}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Optimize
                  </button>
                  
                  <button
                    onClick={performance.clearData}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
              
              {/* Performance Score */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold">Performance Score</h4>
                    <p className="text-blue-100">Overall system performance rating</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{performance.performanceScore.toFixed(0)}</div>
                    <div className="text-blue-100">/ 100</div>
                  </div>
                </div>
                
                <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${performance.performanceScore}%` }}
                  />
                </div>
              </div>
              
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Upload Speed</h4>
                    <Upload className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatFileSize(performance.performance.uploadSpeed)}/s
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Average upload rate
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Download Speed</h4>
                    <Download className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatFileSize(performance.performance.downloadSpeed)}/s
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Average download rate
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Compression Time</h4>
                    <Zap className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performance.performance.compressionTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Average compression time
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Encryption Time</h4>
                    <Shield className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performance.performance.encryptionTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Average encryption time
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Network Latency</h4>
                    <Wifi className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performance.performance.networkLatency.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Average network latency
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Storage Efficiency</h4>
                    <HardDrive className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performance.performance.storageEfficiency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Storage optimization level
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Debug Tab */}
          {activeTab === 'debug' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Debug Information</h3>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => debug.runDiagnostics()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Run Diagnostics
                  </button>
                  
                  <button
                    onClick={() => debug.validateData()}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Validate Data
                  </button>
                  
                  <button
                    onClick={() => backup.optimizeStorage()}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Optimize Storage
                  </button>
                  
                  <button
                    onClick={() => {
                      backup.versions.forEach(v => {
                        if (!v.hash) backup.repairBackup(v.id);
                      });
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Repair Data
                  </button>
                </div>
              </div>
              
              {/* System Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">System Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {Object.entries(debug.systemInfo).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-gray-500 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Debug Logs */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Debug Logs</h4>
                <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                  {debug.logs.length === 0 ? (
                    <p className="text-gray-500">No debug logs available</p>
                  ) : (
                    debug.logs.slice(-50).map((log, index) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={`ml-2 ${
                          log.level === 'error' ? 'text-red-400' :
                          log.level === 'warn' ? 'text-yellow-400' :
                          log.level === 'info' ? 'text-blue-400' :
                          'text-green-400'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="ml-2">{log.message}</span>
                        {log.data && (
                          <div className="ml-8 text-gray-300">
                            {JSON.stringify(log.data, null, 2)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudBackupManager;