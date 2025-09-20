import React, { useState, useEffect, useMemo } from 'react';
import { 
  useWebWorkers, 
  useWebWorkerStats, 
  useWebWorkerTasks, 
  useWebWorkerPools,
  useWebWorkerEvents,
  useWebWorkerDebug,
  useWebWorkerPerformance
} from '../../hooks/useWebWorkers';
import { WorkerTask, WorkerPool } from '../../utils/webWorkers';
import { 
  formatBytes, 
  formatDuration, 
  getTaskStatusColor, 
  getTaskPriorityColor, 
  getTaskTypeIcon 
} from '../../utils/webWorkers';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  Settings,
  Activity,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
  BarChart3,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Filter,
  Search,
  MoreVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WebWorkersManagerProps {
  className?: string;
}

export const WebWorkersManager: React.FC<WebWorkersManagerProps> = ({ className = '' }) => {
  // Hooks
  const webWorkers = useWebWorkers();
  const { stats } = useWebWorkerStats();
  const { tasks, createTask, processTask, cancelTask, retryTask } = useWebWorkerTasks();
  const { pools, createPool, scalePool, terminatePool } = useWebWorkerPools();
  const { events, logs } = useWebWorkerEvents();
  const { debugInfo, enableDebugMode, disableDebugMode } = useWebWorkerDebug();
  const { performanceReport, usageStats } = useWebWorkerPerformance();

  // Local State
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'pools' | 'performance' | 'events' | 'settings' | 'debug'>('overview');
  const [selectedTask, setSelectedTask] = useState<WorkerTask | null>(null);
  const [selectedPool, setSelectedPool] = useState<WorkerPool | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkerTask['status'] | 'all'>('all');
  const [filterType, setFilterType] = useState<WorkerTask['type'] | 'all'>('all');
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        webWorkers.analytics.getMetrics();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, webWorkers.analytics]);

  // Generate demo data
  useEffect(() => {
    const generateDemoData = () => {
      if (tasks.length === 0) {
        // Create some demo tasks
        const demoTasks = [
          {
            type: 'video-processing' as const,
            priority: 'high' as const,
            data: { fileName: 'demo-video.mp4', size: 50000000 },
            metadata: { fileName: 'demo-video.mp4', fileSize: 50000000, format: 'video/mp4' }
          },
          {
            type: 'image-optimization' as const,
            priority: 'medium' as const,
            data: { fileName: 'demo-image.jpg', size: 2000000 },
            metadata: { fileName: 'demo-image.jpg', fileSize: 2000000, format: 'image/jpeg' }
          },
          {
            type: 'thumbnail-generation' as const,
            priority: 'low' as const,
            data: { fileName: 'demo-thumbnail.mp4', size: 30000000 },
            metadata: { fileName: 'demo-thumbnail.mp4', fileSize: 30000000, format: 'video/mp4' }
          }
        ];

        demoTasks.forEach(taskData => {
          createTask(taskData);
        });
      }
    };

    const timer = setTimeout(generateDemoData, 1000);
    return () => clearTimeout(timer);
  }, [tasks.length, createTask]);

  // Filter and sort functions
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.metadata?.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesType = filterType === 'all' || task.type === filterType;
      
      return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, searchTerm, filterStatus, filterType]);

  // Status cards data
  const statusCards = useMemo(() => [
    {
      title: 'Total Tasks',
      value: webWorkers.computed.totalTasks,
      icon: Activity,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Tasks',
      value: webWorkers.computed.activeTasks,
      icon: Play,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      change: '+2.1%'
    },
    {
      title: 'Avg Processing',
      value: formatDuration(stats.averageProcessingTime),
      icon: Clock,
      color: 'bg-orange-500',
      change: '-8%'
    }
  ], [webWorkers.computed, stats]);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'tasks', label: 'Tasks', icon: Activity },
    { id: 'pools', label: 'Worker Pools', icon: Users },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Eye }
  ];

  // Handle task actions
  const handleProcessTask = async (taskId: string) => {
    try {
      await processTask(taskId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process task');
      setShowErrorModal(true);
    }
  };

  const handleCancelTask = (taskId: string) => {
    try {
      cancelTask(taskId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel task');
      setShowErrorModal(true);
    }
  };

  const handleRetryTask = (taskId: string) => {
    try {
      retryTask(taskId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to retry task');
      setShowErrorModal(true);
    }
  };

  // Handle pool actions
  const handleScalePool = (poolId: string, workerCount: number) => {
    try {
      scalePool(poolId, workerCount);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to scale pool');
      setShowErrorModal(true);
    }
  };

  const handleTerminatePool = (poolId: string) => {
    try {
      terminatePool(poolId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to terminate pool');
      setShowErrorModal(true);
    }
  };

  // Toggle debug mode
  const handleToggleDebugMode = () => {
    if (isDebugMode) {
      disableDebugMode();
    } else {
      enableDebugMode();
    }
    setIsDebugMode(!isDebugMode);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Web Workers Manager</h2>
            <p className="text-gray-600 mt-1">
              Advanced background processing with intelligent task management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleToggleDebugMode}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDebugMode
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isDebugMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`${card.color} rounded-lg p-3`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-green-600 font-medium">{card.change}</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    webWorkers.computed.systemHealth ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    System Status: {webWorkers.computed.systemHealth ? 'Healthy' : 'Issues Detected'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    CPU Usage: {stats.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">
                    Memory: {formatBytes(stats.memoryUsage)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => webWorkers.actions.processQueue()}
                  className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Process Queue</span>
                </button>
                <button
                  onClick={() => webWorkers.actions.pauseProcessing()}
                  className="flex items-center justify-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Processing</span>
                </button>
                <button
                  onClick={() => webWorkers.actions.clearCompletedTasks()}
                  className="flex items-center justify-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Completed</span>
                </button>
                <button
                  onClick={() => webWorkers.advanced.optimizeForPerformance()}
                  className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>Optimize</span>
                </button>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      event.severity === 'error' ? 'bg-red-500' :
                      event.severity === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-gray-700">{event.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="video-processing">Video Processing</option>
                <option value="image-optimization">Image Optimization</option>
                <option value="data-analysis">Data Analysis</option>
                <option value="compression">Compression</option>
                <option value="transcoding">Transcoding</option>
                <option value="thumbnail-generation">Thumbnail Generation</option>
              </select>
            </div>

            {/* Tasks List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
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
                            <span className="text-lg mr-3">{getTaskTypeIcon(task.type)}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {task.metadata?.fileName || task.type}
                              </div>
                              <div className="text-sm text-gray-500">
                                {task.metadata?.fileSize ? formatBytes(task.metadata.fileSize) : 'No size info'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'failed' ? 'bg-red-100 text-red-800' :
                            task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{task.progress}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.actualDuration ? formatDuration(task.actualDuration) : 
                           task.startTime ? formatDuration(Date.now() - task.startTime) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {task.status === 'pending' && (
                              <button
                                onClick={() => handleProcessTask(task.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {task.status === 'running' && (
                              <button
                                onClick={() => handleCancelTask(task.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            )}
                            {task.status === 'failed' && (
                              <button
                                onClick={() => handleRetryTask(task.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowTaskModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pools Tab */}
        {activeTab === 'pools' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map((pool) => (
                <div key={pool.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {pool.type.replace('-', ' ')}
                    </h3>
                    <div className={`w-3 h-3 rounded-full ${
                      pool.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active Workers:</span>
                      <span className="font-medium">{pool.activeWorkers}/{pool.maxWorkers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Queued Tasks:</span>
                      <span className="font-medium">{pool.queuedTasks.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium">{pool.performance.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Throughput:</span>
                      <span className="font-medium">{pool.performance.throughput.toFixed(1)}/min</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleScalePool(pool.id, pool.maxWorkers + 1)}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Scale Up
                    </button>
                    <button
                      onClick={() => handleScalePool(pool.id, Math.max(1, pool.maxWorkers - 1))}
                      className="flex-1 bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600 transition-colors"
                    >
                      Scale Down
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {['performance', 'events', 'settings', 'debug'].includes(activeTab) && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab
            </h3>
            <p className="text-gray-600">
              This section is under development. Advanced {activeTab} features will be available soon.
            </p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedTask.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedTask.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className={`text-sm font-medium ${getTaskStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <p className={`text-sm font-medium ${getTaskPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Progress</label>
                  <p className="text-sm text-gray-900">{selectedTask.progress}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Retry Count</label>
                  <p className="text-sm text-gray-900">{selectedTask.retryCount}/{selectedTask.maxRetries}</p>
                </div>
              </div>
              
              {selectedTask.metadata && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metadata</label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedTask.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedTask.error && (
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Error</label>
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{selectedTask.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <p className="text-red-700 mb-4">{errorMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebWorkersManager;