import React, { useState, useCallback, useRef } from 'react';
import { useAssetCompression, CompressionTask, CompressionConfig } from '../../hooks/useAssetCompression';
import {
  Play,
  Pause,
  Square,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Settings,
  BarChart3,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  File,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  HardDrive,
  Cpu,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  AlertTriangle,
  Info
} from 'lucide-react';

interface AssetCompressionManagerProps {
  className?: string;
}

const AssetCompressionManager: React.FC<AssetCompressionManagerProps> = ({ className = '' }) => {
  const { state, config, actions } = useAssetCompression();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'settings' | 'analytics' | 'test'>('dashboard');
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter tasks based on current filter and search term
  const filteredTasks = Array.from(state.tasks.values()).filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.file.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      actions.addTask(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [actions]);
  
  const handleBulkCompress = useCallback(async () => {
    const pendingTasks = Array.from(state.tasks.values())
      .filter(task => task.status === 'pending')
      .map(task => task.file);
    
    if (pendingTasks.length > 0) {
      await actions.compressFiles(pendingTasks);
    }
  }, [state.tasks, actions]);
  
  const handleTaskAction = useCallback(async (taskId: string, action: 'compress' | 'retry' | 'remove' | 'download') => {
    switch (action) {
      case 'compress':
        await actions.compressFile(taskId);
        break;
      case 'retry':
        await actions.retryTask(taskId);
        break;
      case 'remove':
        actions.removeTask(taskId);
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
        break;
      case 'download':
        const task = state.tasks.get(taskId);
        if (task?.result) {
          const url = URL.createObjectURL(task.result);
          const a = document.createElement('a');
          a.href = url;
          a.download = `compressed_${task.file.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        break;
    }
  }, [actions, state.tasks]);
  
  const handleBulkAction = useCallback((action: 'compress' | 'remove' | 'retry') => {
    selectedTasks.forEach(taskId => {
      if (action === 'remove') {
        actions.removeTask(taskId);
      } else if (action === 'retry') {
        actions.retryTask(taskId);
      } else if (action === 'compress') {
        actions.compressFile(taskId);
      }
    });
    setSelectedTasks(new Set());
  }, [selectedTasks, actions]);
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (type.startsWith('video/')) return <FileVideo className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <FileAudio className="w-4 h-4" />;
    if (type.startsWith('text/')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{state.analytics.totalTasks}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compression Ratio</p>
              <p className="text-2xl font-bold text-gray-900">
                {(state.analytics.averageCompressionRatio * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bandwidth Saved</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(state.analytics.bandwidthSaved)}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {state.analytics.performanceScore.toFixed(0)}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Cpu className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </button>
          
          <button
            onClick={handleBulkCompress}
            disabled={state.isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Compress All
          </button>
          
          <button
            onClick={actions.clearCompleted}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Completed
          </button>
          
          <button
            onClick={actions.clearCache}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <HardDrive className="w-4 h-4" />
            Clear Cache
          </button>
        </div>
      </div>
      
      {/* Recent Tasks */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
        <div className="space-y-3">
          {Array.from(state.tasks.values())
            .slice(-5)
            .reverse()
            .map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(task.file.type)}
                  <div>
                    <p className="font-medium text-gray-900">{task.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(task.originalSize)}
                      {task.compressedSize && (
                        <span> → {formatFileSize(task.compressedSize)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  <span className="text-sm text-gray-600 capitalize">{task.status}</span>
                </div>
              </div>
            ))
          }
          {state.tasks.size === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No compression tasks yet</p>
              <p className="text-sm">Upload files to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderTasks = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {selectedTasks.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedTasks.size} selected
              </span>
              <button
                onClick={() => handleBulkAction('compress')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Compress
              </button>
              <button
                onClick={() => handleBulkAction('retry')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={() => handleBulkAction('remove')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Tasks List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
                      } else {
                        setSelectedTasks(new Set());
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">File</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Progress</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Compression</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedTasks);
                        if (e.target.checked) {
                          newSet.add(task.id);
                        } else {
                          newSet.delete(task.id);
                        }
                        setSelectedTasks(newSet);
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(task.file.type)}
                      <div>
                        <p className="font-medium text-gray-900">{task.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(task.file.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {task.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{formatFileSize(task.originalSize)}</p>
                      {task.compressedSize && (
                        <p className="text-sm text-green-600">{formatFileSize(task.compressedSize)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="text-sm text-gray-600 capitalize">{task.status}</span>
                    </div>
                    {task.error && (
                      <p className="text-xs text-red-600 mt-1">{task.error}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{task.progress}%</p>
                  </td>
                  <td className="px-4 py-3">
                    {task.compressionRatio !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-green-600">
                          {(task.compressionRatio * 100).toFixed(1)}%
                        </p>
                        {task.startTime && task.endTime && (
                          <p className="text-xs text-gray-500">
                            {formatDuration(task.endTime - task.startTime)}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'compress')}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Compress"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      
                      {task.status === 'failed' && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'retry')}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Retry"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      
                      {task.status === 'completed' && task.result && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'download')}
                          className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleTaskAction(task.id, 'remove')}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <FileImage className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No tasks found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or upload new files</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compression Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Image Compression</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality ({config.imageQuality}%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={config.imageQuality}
                onChange={(e) => actions.updateConfig({ imageQuality: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                value={config.imageFormat}
                onChange={(e) => actions.updateConfig({ imageFormat: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto</option>
                <option value="webp">WebP</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Size (px)
              </label>
              <input
                type="number"
                value={config.maxImageSize}
                onChange={(e) => actions.updateConfig({ maxImageSize: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Video Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Video Compression</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality ({config.videoQuality}%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={config.videoQuality}
                onChange={(e) => actions.updateConfig({ videoQuality: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitrate (kbps)
              </label>
              <input
                type="number"
                value={config.videoBitrate}
                onChange={(e) => actions.updateConfig({ videoBitrate: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                value={config.videoFormat}
                onChange={(e) => actions.updateConfig({ videoFormat: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto</option>
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
              </select>
            </div>
          </div>
          
          {/* Audio Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Audio Compression</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality ({config.audioQuality}%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={config.audioQuality}
                onChange={(e) => actions.updateConfig({ audioQuality: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitrate (kbps)
              </label>
              <input
                type="number"
                value={config.audioBitrate}
                onChange={(e) => actions.updateConfig({ audioBitrate: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* General Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">General Settings</h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableGzip}
                  onChange={(e) => actions.updateConfig({ enableGzip: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Gzip</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableBrotli}
                  onChange={(e) => actions.updateConfig({ enableBrotli: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Brotli</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableBatchProcessing}
                  onChange={(e) => actions.updateConfig({ enableBatchProcessing: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Batch Processing</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableWorkerCompression}
                  onChange={(e) => actions.updateConfig({ enableWorkerCompression: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Worker Compression</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableCaching}
                  onChange={(e) => actions.updateConfig({ enableCaching: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Caching</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-2">Cache Performance</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Hit Rate</span>
              <span className="text-sm font-medium">{(state.analytics.cacheHitRate * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${state.analytics.cacheHitRate * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-2">Worker Utilization</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Usage</span>
              <span className="text-sm font-medium">{(state.analytics.workerUtilization * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${state.analytics.workerUtilization * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-2">Success Rate</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rate</span>
              <span className="text-sm font-medium">
                {state.analytics.totalTasks > 0 
                  ? ((state.analytics.completedTasks / state.analytics.totalTasks) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ 
                  width: `${state.analytics.totalTasks > 0 
                    ? (state.analytics.completedTasks / state.analytics.totalTasks) * 100
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Compression by Type */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compression by Type</h3>
        <div className="space-y-3">
          {Object.entries(state.analytics.compressionsByType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getFileIcon(`${type}/`)}
                <span className="text-sm font-medium text-gray-900 capitalize">{type}</span>
              </div>
              <span className="text-sm text-gray-600">{count} files</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Error Analysis */}
      {Object.keys(state.analytics.errorsByType).length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Analysis</h3>
          <div className="space-y-3">
            {Object.entries(state.analytics.errorsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-900 capitalize">{type}</span>
                </div>
                <span className="text-sm text-red-600">{count} errors</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  const renderTest = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Compression</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Test Files
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,text/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileImage className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-2">Drag and drop files here, or click to select</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Select Files
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Supported Formats</span>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Images: JPEG, PNG, WebP, GIF</li>
                <li>• Videos: MP4, WebM, AVI, MOV</li>
                <li>• Audio: MP3, AAC, OGG, WAV</li>
                <li>• Text: TXT, JSON, CSV, XML</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Expected Results</span>
              </div>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Images: 30-70% size reduction</li>
                <li>• Videos: 20-50% size reduction</li>
                <li>• Audio: 40-60% size reduction</li>
                <li>• Text: 60-80% size reduction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Asset Compression Manager</h1>
        <p className="text-gray-600">
          Optimize your assets with advanced compression algorithms and intelligent caching
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'tasks', label: 'Tasks', icon: FileImage },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'test', label: 'Test', icon: Zap }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'tasks' && renderTasks()}
      {activeTab === 'settings' && renderSettings()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'test' && renderTest()}
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,text/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default AssetCompressionManager;