import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useVirtualDOM, VNode, VDOMConfig } from '../../hooks/useVirtualDOM';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  BarChart3,
  Cpu,
  MemoryStick,
  Zap,
  Code,
  Tree,
  Layers,
  Activity,
  TrendingUp,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Monitor,
  Database,
  Gauge
} from 'lucide-react';

interface VirtualDOMManagerProps {
  className?: string;
}

const VirtualDOMManager: React.FC<VirtualDOMManagerProps> = ({ className = '' }) => {
  const { state, config, actions } = useVirtualDOM();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tree' | 'performance' | 'cache' | 'test' | 'settings'>('dashboard');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [testComponent, setTestComponent] = useState('');
  const [testProps, setTestProps] = useState('{}');
  const [renderTarget, setRenderTarget] = useState<HTMLElement | null>(null);
  const testContainerRef = useRef<HTMLDivElement>(null);
  const monitoringIntervalRef = useRef<number | null>(null);
  
  // Start/stop monitoring
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      setIsMonitoring(false);
    } else {
      monitoringIntervalRef.current = window.setInterval(() => {
        // Trigger metrics update
        actions.getMetrics();
      }, 1000);
      setIsMonitoring(true);
    }
  }, [isMonitoring, actions]);
  
  // Test component rendering
  const handleTestRender = useCallback(() => {
    if (!testComponent.trim()) return;
    
    try {
      const props = JSON.parse(testProps);
      
      // Create a simple test component
      const TestComponent = (props: any) => {
        return actions.createElement('div', {
          className: 'p-4 bg-blue-100 rounded-lg',
          key: 'test-component'
        }, 
          actions.createElement('h3', { className: 'font-bold text-blue-900' }, 'Test Component'),
          actions.createElement('p', { className: 'text-blue-700' }, `Component: ${testComponent}`),
          actions.createElement('pre', { className: 'text-xs bg-blue-50 p-2 rounded mt-2' }, JSON.stringify(props, null, 2))
        );
      };
      
      if (testContainerRef.current) {
        actions.render(TestComponent, props, testContainerRef.current);
      }
    } catch (error) {
      console.error('Test render error:', error);
    }
  }, [testComponent, testProps, actions]);
  
  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // Render VNode tree
  const renderVNodeTree = (node: VNode | null, depth = 0): React.ReactNode => {
    if (!node) return null;
    
    const indent = depth * 20;
    
    return (
      <div key={`${node.type}-${depth}`} className="font-mono text-sm">
        <div 
          className="flex items-center py-1 hover:bg-gray-50 rounded"
          style={{ paddingLeft: `${indent}px` }}
        >
          <div className="flex items-center gap-2">
            {node.children.length > 0 && (
              <button className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <Tree className="w-3 h-3" />
              </button>
            )}
            <span className="text-blue-600 font-medium">
              &lt;{typeof node.type === 'string' ? node.type : 'Component'}
            </span>
            {node.key && (
              <span className="text-purple-600 text-xs">key="{node.key}"</span>
            )}
            {Object.keys(node.props).length > 0 && (
              <span className="text-gray-500 text-xs">
                {Object.keys(node.props).filter(k => k !== 'children').length} props
              </span>
            )}
            <span className="text-blue-600">&gt;</span>
          </div>
        </div>
        
        {node.children.map((child, index) => (
          <div key={index}>
            {renderVNodeTree(child, depth + 1)}
          </div>
        ))}
        
        {node.children.length > 0 && (
          <div 
            className="text-blue-600 font-medium"
            style={{ paddingLeft: `${indent}px` }}
          >
            &lt;/{typeof node.type === 'string' ? node.type : 'Component'}&gt;
          </div>
        )}
      </div>
    );
  };
  
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Render Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(state.metrics.renderTime)}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {(state.metrics.cacheHitRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(state.metrics.memoryUsage)}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <MemoryStick className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nodes Created</p>
              <p className="text-2xl font-bold text-gray-900">
                {state.metrics.nodesCreated}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Layers className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleMonitoring}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isMonitoring
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMonitoring ? (
              <>
                <Square className="w-4 h-4" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Monitoring
              </>
            )}
          </button>
          
          <button
            onClick={actions.clearCache}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </button>
          
          <button
            onClick={() => {
              const data = actions.exportData();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'vdom-data.json';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>
      
      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendering Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current State</span>
              <div className="flex items-center gap-2">
                {state.isRendering ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-sm text-blue-600">Rendering</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Idle</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tree Nodes</span>
              <span className="text-sm font-medium text-gray-900">
                {state.tree ? this.countNodes(state.tree) : 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Patches</span>
              <span className="text-sm font-medium text-gray-900">
                {state.patches.length}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Render Queue</span>
              <span className="text-sm font-medium text-gray-900">
                {state.renderQueue.length}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Batching</span>
              <div className="flex items-center gap-2">
                {config.enableBatching ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  config.enableBatching ? 'text-green-600' : 'text-red-600'
                }`}>
                  {config.enableBatching ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Memoization</span>
              <div className="flex items-center gap-2">
                {config.enableMemoization ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  config.enableMemoization ? 'text-green-600' : 'text-red-600'
                }`}>
                  {config.enableMemoization ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lazy Rendering</span>
              <div className="flex items-center gap-2">
                {config.enableLazyRendering ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${
                  config.enableLazyRendering ? 'text-green-600' : 'text-red-600'
                }`}>
                  {config.enableLazyRendering ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Max Depth</span>
              <span className="text-sm font-medium text-gray-900">
                {config.maxDepth}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderTree = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Virtual DOM Tree</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Refresh tree view
                actions.getMetrics();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-auto">
          {state.tree ? (
            renderVNodeTree(state.tree)
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Tree className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No virtual DOM tree available</p>
              <p className="text-sm">Render a component to see the tree structure</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Patches */}
      {state.patches.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Patches</h3>
          <div className="space-y-2">
            {state.patches.slice(-10).map((patch, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  patch.type === 'CREATE' ? 'bg-green-500' :
                  patch.type === 'UPDATE' ? 'bg-blue-500' :
                  patch.type === 'DELETE' ? 'bg-red-500' :
                  patch.type === 'REPLACE' ? 'bg-orange-500' :
                  'bg-purple-500'
                }`} />
                <span className="text-sm font-medium text-gray-900">{patch.type}</span>
                {patch.node && (
                  <span className="text-sm text-gray-600">
                    {typeof patch.node.type === 'string' ? patch.node.type : 'Component'}
                  </span>
                )}
                {patch.index !== undefined && (
                  <span className="text-xs text-gray-500">index: {patch.index}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  const renderPerformance = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-2">Render Performance</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Render Time</span>
              <span className="text-sm font-medium">{formatDuration(state.metrics.renderTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Diff Time</span>
              <span className="text-sm font-medium">{formatDuration(state.metrics.diffTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Patch Time</span>
              <span className="text-sm font-medium">{formatDuration(state.metrics.patchTime)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-2">Node Operations</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Created</span>
              <span className="text-sm font-medium text-green-600">{state.metrics.nodesCreated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Updated</span>
              <span className="text-sm font-medium text-blue-600">{state.metrics.nodesUpdated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Deleted</span>
              <span className="text-sm font-medium text-red-600">{state.metrics.nodesDeleted}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-2">System Resources</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Memory</span>
              <span className="text-sm font-medium">{formatBytes(state.metrics.memoryUsage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Batches</span>
              <span className="text-sm font-medium">{state.metrics.batchesProcessed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Virtualized</span>
              <span className="text-sm font-medium">{state.metrics.virtualizedNodes}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Tips */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
        <div className="space-y-3">
          {state.metrics.cacheHitRate < 0.5 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Low Cache Hit Rate</p>
                <p className="text-sm text-yellow-700">
                  Consider enabling memoization or optimizing component props
                </p>
              </div>
            </div>
          )}
          
          {state.metrics.renderTime > 16 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Slow Render Time</p>
                <p className="text-sm text-red-700">
                  Render time exceeds 16ms. Consider enabling batching or lazy rendering
                </p>
              </div>
            </div>
          )}
          
          {!config.enableBatching && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Enable Batching</p>
                <p className="text-sm text-blue-700">
                  Batching can improve performance by grouping DOM updates
                </p>
              </div>
            </div>
          )}
          
          {state.metrics.nodesCreated > 1000 && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Info className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-purple-900">Consider Virtualization</p>
                <p className="text-sm text-purple-700">
                  Large number of nodes created. Virtualization might help with performance
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderCache = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cache Statistics</h3>
          <button
            onClick={actions.clearCache}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">Cache Size</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{state.cache.size}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="font-medium text-gray-900">Hit Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(state.metrics.cacheHitRate * 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-gray-900">Memoized</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{state.memoizedComponents.size}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MemoryStick className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-gray-900">Memory</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatBytes(state.metrics.memoryUsage)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Cache Entries */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Entries</h3>
        <div className="space-y-2">
          {Array.from(state.cache.entries()).slice(0, 10).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 truncate">{key}</p>
                <p className="text-sm text-gray-500">Cached component</p>
              </div>
              <button
                onClick={() => {
                  const newCache = new Map(state.cache);
                  newCache.delete(key);
                  // Update cache through actions if available
                }}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Remove from cache"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {state.cache.size === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No cached components</p>
              <p className="text-sm">Components will be cached as they are rendered</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderTest = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Component Rendering</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Name
              </label>
              <input
                type="text"
                value={testComponent}
                onChange={(e) => setTestComponent(e.target.value)}
                placeholder="TestComponent"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Props (JSON)
              </label>
              <textarea
                value={testProps}
                onChange={(e) => setTestProps(e.target.value)}
                placeholder='{"title": "Hello World", "count": 42}'
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleTestRender}
              disabled={!testComponent.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              Render Test Component
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Render Output
            </label>
            <div 
              ref={testContainerRef}
              className="w-full h-64 border border-gray-300 rounded-lg p-4 bg-gray-50 overflow-auto"
            >
              <div className="text-center text-gray-500 mt-20">
                <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Rendered component will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Virtual DOM Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Performance</h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableBatching}
                  onChange={(e) => actions.updateConfig({ enableBatching: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Batching</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableMemoization}
                  onChange={(e) => actions.updateConfig({ enableMemoization: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Memoization</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableLazyRendering}
                  onChange={(e) => actions.updateConfig({ enableLazyRendering: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Lazy Rendering</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableVirtualization}
                  onChange={(e) => actions.updateConfig({ enableVirtualization: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Virtualization</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableDiffOptimization}
                  onChange={(e) => actions.updateConfig({ enableDiffOptimization: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Diff Optimization</span>
              </label>
            </div>
          </div>
          
          {/* Limits and Thresholds */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Limits &amp; Thresholds</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Size ({config.batchSize})
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={config.batchSize}
                onChange={(e) => actions.updateConfig({ batchSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Depth ({config.maxDepth})
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={config.maxDepth}
                onChange={(e) => actions.updateConfig({ maxDepth: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Threshold ({config.updateThreshold}ms)
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={config.updateThreshold}
                onChange={(e) => actions.updateConfig({ updateThreshold: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Helper method to count nodes in tree
  const countNodes = (node: VNode): number => {
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
  };
  
  // Cleanup monitoring on unmount
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);
  
  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Virtual DOM Manager</h1>
        <p className="text-gray-600">
          Monitor and optimize your custom Virtual DOM implementation for maximum performance
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Monitor },
            { id: 'tree', label: 'Tree', icon: Tree },
            { id: 'performance', label: 'Performance', icon: Gauge },
            { id: 'cache', label: 'Cache', icon: Database },
            { id: 'test', label: 'Test', icon: Code },
            { id: 'settings', label: 'Settings', icon: Settings }
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
      {activeTab === 'tree' && renderTree()}
      {activeTab === 'performance' && renderPerformance()}
      {activeTab === 'cache' && renderCache()}
      {activeTab === 'test' && renderTest()}
      {activeTab === 'settings' && renderSettings()}
    </div>
  );
};

export default VirtualDOMManager;