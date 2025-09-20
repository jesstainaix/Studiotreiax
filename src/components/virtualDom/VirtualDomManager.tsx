import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Activity, 
  Zap, 
  Database, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MemoryStick,
  Cpu,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Search,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Layers,
  GitBranch,
  Maximize,
  Minimize,
  RefreshCw
} from 'lucide-react';
import { useVirtualDOM, useVirtualDOMStats, useVirtualDOMConfig, useVirtualDOMMetrics, useVirtualDOMEvents } from '../../hooks/useVirtualDOM';
import { VirtualNode, VirtualTree, VirtualPatch, RenderOptimization, formatBytes, formatDuration, getOptimizationTypeColor, getPerformanceScoreColor, getNodeTypeIcon } from '../../utils/virtualDOM';

interface VirtualDOMManagerProps {
  className?: string;
}

export const VirtualDOMManager: React.FC<VirtualDOMManagerProps> = ({ className }) => {
  const {
    trees,
    patches,
    optimizations,
    config,
    stats,
    metrics,
    events,
    isRendering,
    isOptimizing,
    computed,
    actions,
    quickActions,
    configuration,
    analytics,
    debug
  } = useVirtualDOM();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTree, setSelectedTree] = useState<VirtualTree | null>(null);
  const [selectedNode, setSelectedNode] = useState<VirtualNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Auto-refresh effect
  useEffect(() => {
    if (isAutoRefresh) {
      const interval = setInterval(() => {
        analytics.getMetrics();
        analytics.getStats();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, analytics]);

  // Demo data generation effect
  useEffect(() => {
    const generateDemoData = () => {
      if (trees.length < 3) {
        // Create additional demo trees
        for (let i = trees.length; i < 3; i++) {
          const rootNode = actions.createNode('div', { 
            className: `demo-app-${i}`,
            'data-testid': `app-${i}`
          }, [
            actions.createNode('header', { className: 'header' }, [
              actions.createNode('h1', { children: `Demo App ${i + 1}` }),
              actions.createNode('nav', { className: 'navigation' }, [
                actions.createNode('button', { children: 'Home' }),
                actions.createNode('button', { children: 'About' }),
                actions.createNode('button', { children: 'Contact' })
              ])
            ]),
            actions.createNode('main', { className: 'main-content' }, [
              actions.createNode('section', { className: 'hero' }, [
                actions.createNode('h2', { children: 'Welcome to Virtual DOM' }),
                actions.createNode('p', { children: 'Experience the power of optimized rendering' })
              ]),
              actions.createNode('section', { className: 'features' }, [
                ...Array.from({ length: 5 }, (_, j) => 
                  actions.createNode('div', { 
                    className: 'feature-card',
                    key: `feature-${j}`
                  }, [
                    actions.createNode('h3', { children: `Feature ${j + 1}` }),
                    actions.createNode('p', { children: `Description for feature ${j + 1}` })
                  ])
                )
              ])
            ]),
            actions.createNode('footer', { className: 'footer' }, [
              actions.createNode('p', { children: '© 2024 Virtual DOM Demo' })
            ])
          ]);
          
          actions.createTree(rootNode);
        }
      }
    };

    const timer = setTimeout(generateDemoData, 1000);
    return () => clearTimeout(timer);
  }, [trees.length, actions]);

  // Filter and sort functions
  const filteredTrees = useMemo(() => {
    return trees.filter(tree => {
      if (searchTerm) {
        return tree.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
               Array.from(tree.nodes.values()).some(node => 
                 node.type.toLowerCase().includes(searchTerm.toLowerCase())
               );
      }
      return true;
    });
  }, [trees, searchTerm]);

  const filteredOptimizations = useMemo(() => {
    return optimizations.filter(opt => {
      if (filterType !== 'all') {
        return opt.type === filterType;
      }
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          return b.impact - a.impact;
        case 'savings':
          return b.savings - a.savings;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
  }, [optimizations, filterType, sortBy]);

  const filteredPatches = useMemo(() => {
    return patches.filter(patch => {
      if (filterType !== 'all') {
        return patch.type === filterType;
      }
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return b.timestamp - a.timestamp;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
  }, [patches, filterType, sortBy]);

  // Status cards data
  const statusCards = [
    {
      title: 'Virtual Trees',
      value: computed.totalTrees,
      description: `${computed.activeTrees} active`,
      icon: GitBranch,
      color: 'text-blue-500',
      trend: '+12%'
    },
    {
      title: 'Total Nodes',
      value: stats.totalNodes,
      description: `${stats.memoizedNodes} memoized`,
      icon: Layers,
      color: 'text-green-500',
      trend: '+8%'
    },
    {
      title: 'Render Performance',
      value: `${computed.renderPerformance.toFixed(1)}%`,
      description: `${stats.averageRenderTime.toFixed(1)}ms avg`,
      icon: Zap,
      color: getPerformanceScoreColor(computed.renderPerformance),
      trend: computed.renderPerformance > 80 ? '+5%' : '-2%'
    },
    {
      title: 'Memory Efficiency',
      value: `${computed.memoryEfficiency.toFixed(1)}%`,
      description: formatBytes(stats.memoryUsage),
      icon: MemoryStick,
      color: 'text-purple-500',
      trend: '+3%'
    }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'trees', label: 'Trees', icon: GitBranch },
    { id: 'nodes', label: 'Nodes', icon: Layers },
    { id: 'optimizations', label: 'Optimizations', icon: Zap },
    { id: 'patches', label: 'Patches', icon: RefreshCw },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Eye }
  ];

  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'renderAll':
          await quickActions.renderAll();
          break;
        case 'optimizeAll':
          await quickActions.optimizeAll();
          break;
        case 'clearCache':
          await quickActions.clearCache();
          break;
        default:
          break;
      }
    } catch (error) {
      setErrorMessage(`Failed to execute ${action}: ${error}`);
      setShowError(true);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    configuration.updateConfig({ [key]: value });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Virtual DOM Manager</h2>
          <p className="text-muted-foreground">
            Advanced virtual DOM optimization and performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            {isAutoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAutoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => analytics.getMetrics()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
                <div className="flex items-center pt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">{card.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-1">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Health</span>
                    <span className={getPerformanceScoreColor(computed.systemHealth)}>
                      {computed.systemHealth.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={computed.systemHealth} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Render Performance</span>
                    <span className={getPerformanceScoreColor(computed.renderPerformance)}>
                      {computed.renderPerformance.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={computed.renderPerformance} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Efficiency</span>
                    <span className={getPerformanceScoreColor(computed.memoryEfficiency)}>
                      {computed.memoryEfficiency.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={computed.memoryEfficiency} className="h-2" />
                </div>

                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="flex items-center space-x-1">
                      {isRendering ? (
                        <>
                          <Clock className="h-3 w-3 text-yellow-500" />
                          <span className="text-yellow-500">Rendering</span>
                        </>
                      ) : isOptimizing ? (
                        <>
                          <Zap className="h-3 w-3 text-blue-500" />
                          <span className="text-blue-500">Optimizing</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">Ready</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Optimizations</div>
                    <div className="font-medium">{computed.optimizationCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => handleQuickAction('renderAll')}
                  disabled={isRendering}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Render All Trees
                </Button>
                
                <Button 
                  onClick={() => handleQuickAction('optimizeAll')}
                  disabled={isOptimizing}
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize All
                </Button>
                
                <Button 
                  onClick={() => handleQuickAction('clearCache')}
                  variant="outline"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => configuration.resetConfig()}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const data = analytics.exportData();
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'virtualdom-data.json';
                      a.click();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {events.slice(-10).reverse().map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center space-x-2">
                        <Badge variant={event.severity === 'error' ? 'destructive' : 'secondary'}>
                          {event.type}
                        </Badge>
                        <span className="text-sm">{event.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No events recorded yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trees Tab */}
        <TabsContent value="trees" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search trees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => {
              const rootNode = actions.createNode('div', { className: 'new-tree' });
              actions.createTree(rootNode);
            }}>
              <GitBranch className="h-4 w-4 mr-2" />
              Create Tree
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredTrees.map((tree) => (
              <Card key={tree.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTree(tree)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <GitBranch className="h-5 w-5" />
                      <span>Tree {tree.id.slice(-8)}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={tree.isOptimized ? 'default' : 'secondary'}>
                        {tree.isOptimized ? 'Optimized' : 'Standard'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.optimizeTree(tree.id);
                        }}
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {tree.nodeCount} nodes • Version {tree.version} • {formatDuration(Date.now() - tree.lastUpdate)} ago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Nodes</div>
                      <div className="font-medium">{tree.nodeCount}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Patches</div>
                      <div className="font-medium">{tree.patches.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Render Time</div>
                      <div className="font-medium">{tree.renderTime.toFixed(1)}ms</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Nodes Tab */}
        <TabsContent value="nodes" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Node management interface</p>
            <p className="text-sm">Select a tree to view and manage its nodes</p>
          </div>
        </TabsContent>

        {/* Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Optimization management interface</p>
            <p className="text-sm">Configure and monitor rendering optimizations</p>
          </div>
        </TabsContent>

        {/* Patches Tab */}
        <TabsContent value="patches" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Patch management interface</p>
            <p className="text-sm">View and manage virtual DOM patches</p>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Performance monitoring interface</p>
            <p className="text-sm">Real-time performance metrics and analytics</p>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Event monitoring interface</p>
            <p className="text-sm">Track system events and activities</p>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Virtual DOM Configuration</CardTitle>
              <CardDescription>
                Configure virtual DOM behavior and optimizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Memoization</Label>
                    <div className="text-sm text-muted-foreground">
                      Cache component render results
                    </div>
                  </div>
                  <Switch
                    checked={config.enableMemoization}
                    onCheckedChange={(checked) => handleConfigChange('enableMemoization', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Batching</Label>
                    <div className="text-sm text-muted-foreground">
                      Batch multiple updates together
                    </div>
                  </div>
                  <Switch
                    checked={config.enableBatching}
                    onCheckedChange={(checked) => handleConfigChange('enableBatching', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Virtualization</Label>
                    <div className="text-sm text-muted-foreground">
                      Virtualize large lists for better performance
                    </div>
                  </div>
                  <Switch
                    checked={config.enableVirtualization}
                    onCheckedChange={(checked) => handleConfigChange('enableVirtualization', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Debug Mode</Label>
                    <div className="text-sm text-muted-foreground">
                      Enable detailed logging and debugging
                    </div>
                  </div>
                  <Switch
                    checked={config.debugMode}
                    onCheckedChange={(checked) => handleConfigChange('debugMode', checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Batch Size</Label>
                  <Input
                    type="number"
                    value={config.batchSize}
                    onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Memoization Threshold</Label>
                  <Input
                    type="number"
                    value={config.memoizationThreshold}
                    onChange={(e) => handleConfigChange('memoizationThreshold', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debug Tab */}
        <TabsContent value="debug" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Debug interface</p>
            <p className="text-sm">Advanced debugging and diagnostics</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Node Details Modal */}
      <Dialog open={showNodeDetails} onOpenChange={setShowNodeDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Node Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected virtual node
            </DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Node ID</Label>
                  <div className="font-mono text-sm">{selectedNode.id}</div>
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="flex items-center space-x-2">
                    <span>{getNodeTypeIcon(selectedNode.type)}</span>
                    <span>{selectedNode.type}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Properties</Label>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                  {JSON.stringify(selectedNode.props, null, 2)}
                </pre>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Depth</Label>
                  <div>{selectedNode.depth}</div>
                </div>
                <div>
                  <Label>Render Count</Label>
                  <div>{selectedNode.renderCount}</div>
                </div>
                <div>
                  <Label>Memoized</Label>
                  <div>{selectedNode.memoized ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Error</span>
            </DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualDOMManager;