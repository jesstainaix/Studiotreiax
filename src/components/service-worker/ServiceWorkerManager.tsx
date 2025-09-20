import React, { useState, useEffect } from 'react';
import {
  Activity,
  Settings,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Plus,
  Search,
  Filter,
  Bell,
  BellOff,
  Play,
  Pause,
  SkipForward,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  HardDrive,
  Globe,
  Smartphone,
  Monitor,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Info
} from 'lucide-react';
import useServiceWorker, {
  ServiceWorkerConfig,
  CacheInfo,
  BackgroundSyncTask,
  PushSubscription,
  ServiceWorkerLog,
  CacheStrategy
} from '../../hooks/useServiceWorker';

interface ServiceWorkerManagerProps {
  className?: string;
}

const ServiceWorkerManager: React.FC<ServiceWorkerManagerProps> = ({ className = '' }) => {
  const {
    state,
    metrics,
    config,
    caches,
    backgroundTasks,
    pushSubscription,
    logs,
    isLoading,
    error,
    actions
  } = useServiceWorker();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedCache, setSelectedCache] = useState<CacheInfo | null>(null);
  const [selectedTask, setSelectedTask] = useState<BackgroundSyncTask | null>(null);
  const [newCacheUrl, setNewCacheUrl] = useState('');
  const [newCacheName, setNewCacheName] = useState('');
  const [vapidKey, setVapidKey] = useState('');
  const [backgroundSyncTag, setBackgroundSyncTag] = useState('');
  const [backgroundSyncData, setBackgroundSyncData] = useState('');
  const [importData, setImportData] = useState('');

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      actions.checkForUpdates();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, actions]);

  // Filter functions
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.level.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const filteredTasks = backgroundTasks.filter(task => {
    return task.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
           task.status.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredCaches = caches.filter(cache => {
    return cache.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cache.strategy.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Status bar component
  const StatusBar = () => (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {state.isOffline ? (
              <WifiOff className="h-4 w-4 text-red-500" />
            ) : (
              <Wifi className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm font-medium">
              {state.isOffline ? 'Offline' : 'Online'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {state.isActive ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-sm">
              {state.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          {state.hasUpdate && (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600">Update Available</span>
              <button
                onClick={actions.skipWaiting}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                Update Now
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1 rounded ${
              autoRefresh ? 'text-green-600 bg-green-100' : 'text-gray-400'
            }`}
            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={actions.checkForUpdates}
            disabled={isLoading}
            className="p-1 rounded text-blue-600 hover:bg-blue-100 disabled:opacity-50"
            title="Check for updates"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Tab navigation
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'caches', label: 'Caches', icon: Database },
    { id: 'background', label: 'Background Sync', icon: RefreshCw },
    { id: 'push', label: 'Push Notifications', icon: Bell },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Render dashboard tab
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Service Worker Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Service Worker Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              state.isSupported ? 'text-green-600' : 'text-red-600'
            }`}>
              {state.isSupported ? 'YES' : 'NO'}
            </div>
            <div className="text-sm text-gray-600">Supported</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              state.isRegistered ? 'text-green-600' : 'text-red-600'
            }`}>
              {state.isRegistered ? 'YES' : 'NO'}
            </div>
            <div className="text-sm text-gray-600">Registered</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              state.isActive ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {state.isActive ? 'YES' : 'NO'}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              state.isControlling ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {state.isControlling ? 'YES' : 'NO'}
            </div>
            <div className="text-sm text-gray-600">Controlling</div>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.totalRequests.toLocaleString()}</p>
            </div>
            <Globe className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cache Hits</p>
              <p className="text-2xl font-bold text-green-600">{metrics.cacheHits.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {metrics.totalRequests > 0 ? 
                  `${((metrics.cacheHits / metrics.totalRequests) * 100).toFixed(1)}% hit rate` : 
                  '0% hit rate'
                }
              </p>
            </div>
            <Zap className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cache Size</p>
              <p className="text-2xl font-bold text-purple-600">{formatBytes(metrics.cacheSize)}</p>
              <p className="text-xs text-gray-500">{metrics.cacheEntries} entries</p>
            </div>
            <HardDrive className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Background Syncs</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.backgroundSyncs.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {metrics.lastSync ? formatDate(metrics.lastSync) : 'Never'}
              </p>
            </div>
            <RefreshCw className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Cache Strategies */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Cache Strategies
        </h3>
        <div className="space-y-3">
          {config.cacheStrategies.map((strategy) => (
            <div key={strategy.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  strategy.enabled ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <div className="font-medium">{strategy.name}</div>
                  <div className="text-sm text-gray-600">{strategy.strategy}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {strategy.maxEntries ? `${strategy.maxEntries} entries` : 'Unlimited'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render caches tab
  const renderCaches = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search caches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowModal('addCache')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            <span>Add to Cache</span>
          </button>
          
          <button
            onClick={() => actions.clearCache()}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cache Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hit Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCaches.map((cache) => (
                <tr key={cache.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Database className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium">{cache.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStrategyColor(cache.strategy)
                    }`}>
                      {cache.strategy}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cache.entries.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatBytes(cache.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cache.hits + cache.misses > 0 ? 
                      `${((cache.hits / (cache.hits + cache.misses)) * 100).toFixed(1)}%` : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCache(cache);
                        setShowModal('cacheDetails');
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => actions.clearCache(cache.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render background sync tab
  const renderBackgroundSync = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <button
          onClick={() => setShowModal('scheduleSync')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Sync</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium">{task.tag}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getTaskStatusColor(task.status)
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(task.created)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.attempts} / {task.maxAttempts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowModal('taskDetails');
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render push notifications tab
  const renderPushNotifications = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Push Notification Status
        </h3>
        
        {pushSubscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium text-green-900">Subscribed</div>
                  <div className="text-sm text-green-700">
                    Created: {formatDate(pushSubscription.created)}
                  </div>
                </div>
              </div>
              <button
                onClick={actions.unsubscribeFromPush}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Unsubscribe
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Endpoint:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={pushSubscription.endpoint}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(pushSubscription.endpoint)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <BellOff className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="font-medium text-yellow-900">Not Subscribed</div>
                  <div className="text-sm text-yellow-700">
                    Subscribe to receive push notifications
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">VAPID Key:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={vapidKey}
                  onChange={(e) => setVapidKey(e.target.value)}
                  placeholder="Enter VAPID public key"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => actions.subscribeToPush(vapidKey)}
                  disabled={!vapidKey}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Push Notification Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.pushNotifications}</div>
            <div className="text-sm text-blue-700">Total Received</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {pushSubscription ? 'Active' : 'Inactive'}
            </div>
            <div className="text-sm text-green-700">Subscription Status</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {config.pushNotifications ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-sm text-purple-700">Feature Status</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render logs tab
  const renderLogs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>
        
        <button
          onClick={actions.clearLogs}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          <Trash2 className="h-4 w-4" />
          <span>Clear Logs</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    getLogLevelColor(log.level)
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        getLogLevelBadgeColor(log.level)
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                      <span className="text-xs text-gray-400">
                        [{log.source}]
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-900">{log.message}</div>
                    {log.data && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                        <pre>{JSON.stringify(log.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render settings tab
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Service Worker</label>
              <p className="text-xs text-gray-500">Enable or disable the service worker</p>
            </div>
            <button
              onClick={() => actions.updateConfig({ enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Background Sync</label>
              <p className="text-xs text-gray-500">Enable background synchronization</p>
            </div>
            <button
              onClick={() => actions.updateConfig({ backgroundSync: !config.backgroundSync })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.backgroundSync ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.backgroundSync ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Push Notifications</label>
              <p className="text-xs text-gray-500">Enable push notification support</p>
            </div>
            <button
              onClick={() => actions.updateConfig({ pushNotifications: !config.pushNotifications })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.pushNotifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Cache Size (MB)
            </label>
            <input
              type="number"
              value={Math.round(config.maxCacheSize / (1024 * 1024))}
              onChange={(e) => actions.updateConfig({ 
                maxCacheSize: parseInt(e.target.value) * 1024 * 1024 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Network Timeout (ms)
            </label>
            <input
              type="number"
              value={config.networkTimeout}
              onChange={(e) => actions.updateConfig({ 
                networkTimeout: parseInt(e.target.value) 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Data Management</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowModal('export')}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </button>
          
          <button
            onClick={() => setShowModal('import')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Upload className="h-4 w-4" />
            <span>Import Data</span>
          </button>
          
          <button
            onClick={actions.unregister}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <X className="h-4 w-4" />
            <span>Unregister SW</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Helper functions
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  };

  const getStrategyColor = (strategy: string): string => {
    const colors = {
      'CacheFirst': 'bg-green-100 text-green-800',
      'NetworkFirst': 'bg-blue-100 text-blue-800',
      'StaleWhileRevalidate': 'bg-purple-100 text-purple-800',
      'NetworkOnly': 'bg-red-100 text-red-800',
      'CacheOnly': 'bg-yellow-100 text-yellow-800'
    };
    return colors[strategy as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTaskStatusColor = (status: string): string => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'syncing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getLogLevelColor = (level: string): string => {
    const colors = {
      'info': 'bg-blue-500',
      'warn': 'bg-yellow-500',
      'error': 'bg-red-500',
      'debug': 'bg-gray-500'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500';
  };

  const getLogLevelBadgeColor = (level: string): string => {
    const colors = {
      'info': 'bg-blue-100 text-blue-800',
      'warn': 'bg-yellow-100 text-yellow-800',
      'error': 'bg-red-100 text-red-800',
      'debug': 'bg-gray-100 text-gray-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Modal components
  const renderModal = () => {
    if (!showModal) return null;

    const closeModal = () => {
      setShowModal(null);
      setSelectedCache(null);
      setSelectedTask(null);
      setNewCacheUrl('');
      setNewCacheName('');
      setBackgroundSyncTag('');
      setBackgroundSyncData('');
      setImportData('');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {showModal === 'addCache' && 'Add to Cache'}
              {showModal === 'cacheDetails' && 'Cache Details'}
              {showModal === 'taskDetails' && 'Task Details'}
              {showModal === 'scheduleSync' && 'Schedule Background Sync'}
              {showModal === 'export' && 'Export Data'}
              {showModal === 'import' && 'Import Data'}
            </h3>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {showModal === 'addCache' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={newCacheUrl}
                  onChange={(e) => setNewCacheUrl(e.target.value)}
                  placeholder="https://example.com/resource"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cache Name (optional)
                </label>
                <input
                  type="text"
                  value={newCacheName}
                  onChange={(e) => setNewCacheName(e.target.value)}
                  placeholder="runtime-cache"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    actions.addToCache(newCacheUrl, newCacheName || undefined);
                    closeModal();
                  }}
                  disabled={!newCacheUrl}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Add to Cache
                </button>
              </div>
            </div>
          )}

          {showModal === 'scheduleSync' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag
                </label>
                <input
                  type="text"
                  value={backgroundSyncTag}
                  onChange={(e) => setBackgroundSyncTag(e.target.value)}
                  placeholder="sync-data"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data (JSON)
                </label>
                <textarea
                  value={backgroundSyncData}
                  onChange={(e) => setBackgroundSyncData(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    try {
                      const data = backgroundSyncData ? JSON.parse(backgroundSyncData) : {};
                      actions.scheduleBackgroundSync(backgroundSyncTag, data);
                      closeModal();
                    } catch (error) {
                      alert('Invalid JSON data');
                    }
                  }}
                  disabled={!backgroundSyncTag}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Schedule Sync
                </button>
              </div>
            </div>
          )}

          {showModal === 'export' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Export all service worker data including configuration, metrics, and logs.
              </p>
              <textarea
                value={actions.exportData()}
                readOnly
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(actions.exportData());
                    alert('Data copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}

          {showModal === 'import' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Import service worker data from a previously exported configuration.
              </p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste exported data here..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    actions.importData(importData);
                    closeModal();
                  }}
                  disabled={!importData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Import Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-100 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-blue-500" />
                  Service Worker Manager
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage offline caching, background sync, and push notifications
                </p>
              </div>
              
              {error && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                  <button
                    onClick={actions.clearError}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar />

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
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
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'caches' && renderCaches()}
          {activeTab === 'background' && renderBackgroundSync()}
          {activeTab === 'push' && renderPushNotifications()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default ServiceWorkerManager;