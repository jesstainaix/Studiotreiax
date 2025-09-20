import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Zap,
  Settings,
  BarChart3,
  Image,
  Database,
  Code,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { usePerformanceOptimization, OptimizationRule, PerformanceMetrics } from '@/hooks/usePerformanceOptimization';
import { toast } from 'sonner';

interface PerformanceOptimizationManagerProps {
  className?: string;
}

const PerformanceOptimizationManager: React.FC<PerformanceOptimizationManagerProps> = ({ className }) => {
  const { state, actions } = usePerformanceOptimization();
  const [selectedRule, setSelectedRule] = useState<OptimizationRule | null>(null);
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<OptimizationRule>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [textToCompress, setTextToCompress] = useState('');
  const [compressedText, setCompressedText] = useState('');
  const [cacheKey, setCacheKey] = useState('');
  const [cacheValue, setCacheValue] = useState('');

  // Auto-start monitoring on mount
  useEffect(() => {
    if (state.config.enabled && !state.isMonitoring) {
      actions.startMonitoring();
      toast.success('Performance monitoring started');
    }
  }, [state.config.enabled, state.isMonitoring, actions]);

  const handleOptimize = async () => {
    try {
      const results = await actions.optimize();
      if (results && results.length > 0) {
        toast.success(`Applied ${results.length} optimizations`);
      } else {
        toast.info('No optimizations needed');
      }
    } catch (error) {
      toast.error('Optimization failed');
    }
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const rule: OptimizationRule = {
      id: `rule_${Date.now()}`,
      name: newRule.name,
      description: newRule.description,
      category: newRule.category || 'rendering',
      severity: newRule.severity || 'medium',
      threshold: newRule.threshold || 50,
      enabled: true,
      autoFix: newRule.autoFix || false,
      priority: newRule.priority || 5,
      action: async () => {
      }
    };

    actions.addRule(rule);
    setNewRule({});
    setIsEditingRule(false);
    toast.success('Rule added successfully');
  };

  const handleImageCompress = async () => {
    if (!imageFile) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const compressedFile = await actions.compressImage(imageFile);
      const originalSize = (imageFile.size / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024).toFixed(2);
      const savings = (((imageFile.size - compressedFile.size) / imageFile.size) * 100).toFixed(1);
      
      toast.success(`Image compressed: ${originalSize}KB → ${compressedSize}KB (${savings}% savings)`);
    } catch (error) {
      toast.error('Image compression failed');
    }
  };

  const handleTextCompress = () => {
    if (!textToCompress) {
      toast.error('Please enter text to compress');
      return;
    }

    const compressed = actions.compressText(textToCompress);
    setCompressedText(compressed);
    
    const originalSize = new Blob([textToCompress]).size;
    const compressedSize = new Blob([compressed]).size;
    const savings = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
    
    toast.success(`Text compressed: ${originalSize} bytes → ${compressedSize} bytes (${savings}% savings)`);
  };

  const handleTextDecompress = () => {
    if (!compressedText) {
      toast.error('No compressed text to decompress');
      return;
    }

    const decompressed = actions.decompressText(compressedText);
    setTextToCompress(decompressed);
    toast.success('Text decompressed successfully');
  };

  const handleCacheSet = () => {
    if (!cacheKey || !cacheValue) {
      toast.error('Please enter both key and value');
      return;
    }

    actions.cacheSet(cacheKey, cacheValue);
    setCacheKey('');
    setCacheValue('');
    toast.success('Value cached successfully');
  };

  const handleCacheGet = () => {
    if (!cacheKey) {
      toast.error('Please enter a cache key');
      return;
    }

    const value = actions.cacheGet(cacheKey);
    if (value !== null) {
      setCacheValue(value);
      toast.success('Value retrieved from cache');
    } else {
      toast.error('Key not found in cache');
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'fps': return <Monitor className="h-4 w-4" />;
      case 'memoryUsage': return <HardDrive className="h-4 w-4" />;
      case 'cpuUsage': return <Cpu className="h-4 w-4" />;
      case 'networkLatency': return <Wifi className="h-4 w-4" />;
      case 'loadTime': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getMetricColor = (value: number, metric: string) => {
    const thresholds = {
      fps: { good: 50, warning: 30 },
      memoryUsage: { good: 50, warning: 80 },
      cpuUsage: { good: 50, warning: 80 },
      networkLatency: { good: 100, warning: 500 },
      loadTime: { good: 1000, warning: 3000 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'text-blue-600';

    if (metric === 'fps') {
      return value >= threshold.good ? 'text-green-600' : value >= threshold.warning ? 'text-yellow-600' : 'text-red-600';
    } else {
      return value <= threshold.good ? 'text-green-600' : value <= threshold.warning ? 'text-yellow-600' : 'text-red-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rendering': return <Monitor className="h-4 w-4" />;
      case 'memory': return <HardDrive className="h-4 w-4" />;
      case 'network': return <Wifi className="h-4 w-4" />;
      case 'bundle': return <Code className="h-4 w-4" />;
      case 'dom': return <Activity className="h-4 w-4" />;
      case 'images': return <Image className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const analytics = actions.getAnalytics();
  const cacheStats = actions.getCacheStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Optimization</h2>
          <p className="text-muted-foreground">
            Monitor and optimize application performance in real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={state.isMonitoring ? actions.stopMonitoring : actions.startMonitoring}
            variant={state.isMonitoring ? "destructive" : "default"}
          >
            {state.isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {state.isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
          <Button onClick={handleOptimize} disabled={state.isOptimizing}>
            <Zap className="h-4 w-4 mr-2" />
            {state.isOptimizing ? 'Optimizing...' : 'Optimize Now'}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monitoring</p>
                <p className="text-2xl font-bold">
                  {state.isMonitoring ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${state.isMonitoring ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Activity className={`h-4 w-4 ${state.isMonitoring ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimizations</p>
                <p className="text-2xl font-bold">{state.totalOptimizations}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Improvement Score</p>
                <p className="text-2xl font-bold">{state.improvementScore.toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-full bg-green-100">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{(cacheStats.hitRate * 100).toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-full bg-purple-100">
                <Database className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="compression">Compression</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(state.metrics).map(([key, value]) => {
                  if (typeof value !== 'number') return null;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getMetricIcon(key)}
                        <span className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${getMetricColor(value, key)}`}>
                        {key === 'fps' ? `${value} fps` :
                         key.includes('Usage') ? `${value.toFixed(1)}%` :
                         key.includes('Time') || key.includes('Latency') ? `${value.toFixed(0)}ms` :
                         value.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Optimizations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.results.slice(-5).map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{result.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          +{result.improvement.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.duration.toFixed(0)}ms
                        </p>
                      </div>
                    </div>
                  ))}
                  {state.results.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No optimizations performed yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Analytics Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{analytics.successfulOptimizations}</p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{analytics.failedOptimizations}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{(analytics.successRate * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-2">Average Improvement</p>
                  <Progress value={analytics.averageImprovement} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.averageImprovement.toFixed(1)} points
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Cache Efficiency</p>
                  <Progress value={cacheStats.hitRate * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {cacheStats.size} items cached
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Performance Metrics</CardTitle>
              <CardDescription>
                Monitor key performance indicators in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(state.metrics).map(([key, value]) => {
                  if (typeof value !== 'number') return null;
                  return (
                    <Card key={key}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getMetricIcon(key)}
                            <span className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                          <Badge variant="outline" className={getMetricColor(value, key)}>
                            {key === 'fps' ? `${value} fps` :
                             key.includes('Usage') ? `${value.toFixed(1)}%` :
                             key.includes('Time') || key.includes('Latency') ? `${value.toFixed(0)}ms` :
                             value.toFixed(2)}
                          </Badge>
                        </div>
                        <Progress 
                          value={key === 'fps' ? (value / 60) * 100 : 
                                key.includes('Usage') ? value :
                                Math.min(100, (value / 1000) * 100)} 
                          className="h-2" 
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Optimization Rules</h3>
              <p className="text-sm text-muted-foreground">
                Manage automatic optimization rules and thresholds
              </p>
            </div>
            <Button onClick={() => setIsEditingRule(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {state.rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(rule.category)}
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity}
                      </Badge>
                      <Badge variant="outline">
                        {rule.category}
                      </Badge>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => 
                          actions.updateRule(rule.id, { enabled })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRule(rule);
                          setIsEditingRule(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => actions.removeRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Threshold:</span>
                      <span className="ml-2 font-medium">{rule.threshold}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <span className="ml-2 font-medium">{rule.priority}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Auto-fix:</span>
                      <span className="ml-2 font-medium">{rule.autoFix ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add/Edit Rule Modal */}
          {isEditingRule && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedRule ? 'Edit Rule' : 'Add New Rule'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-name">Name</Label>
                    <Input
                      id="rule-name"
                      value={newRule.name || selectedRule?.name || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Rule name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rule-category">Category</Label>
                    <Select
                      value={newRule.category || selectedRule?.category || 'rendering'}
                      onValueChange={(value) => setNewRule(prev => ({ ...prev, category: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rendering">Rendering</SelectItem>
                        <SelectItem value="memory">Memory</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="bundle">Bundle</SelectItem>
                        <SelectItem value="dom">DOM</SelectItem>
                        <SelectItem value="images">Images</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="rule-description">Description</Label>
                  <Textarea
                    id="rule-description"
                    value={newRule.description || selectedRule?.description || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Rule description"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rule-severity">Severity</Label>
                    <Select
                      value={newRule.severity || selectedRule?.severity || 'medium'}
                      onValueChange={(value) => setNewRule(prev => ({ ...prev, severity: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rule-threshold">Threshold</Label>
                    <Input
                      id="rule-threshold"
                      type="number"
                      value={newRule.threshold || selectedRule?.threshold || 50}
                      onChange={(e) => setNewRule(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rule-priority">Priority</Label>
                    <Input
                      id="rule-priority"
                      type="number"
                      value={newRule.priority || selectedRule?.priority || 5}
                      onChange={(e) => setNewRule(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newRule.autoFix || selectedRule?.autoFix || false}
                    onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, autoFix: checked }))}
                  />
                  <Label>Enable auto-fix</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingRule(false);
                      setSelectedRule(null);
                      setNewRule({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddRule}>
                    {selectedRule ? 'Update' : 'Add'} Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Optimization</CardTitle>
              <CardDescription>
                Trigger specific optimizations and view results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleOptimize} disabled={state.isOptimizing} className="h-20">
                  <div className="text-center">
                    <Zap className="h-6 w-6 mx-auto mb-2" />
                    <div>Run Full Optimization</div>
                    <div className="text-xs opacity-75">Analyze and optimize all metrics</div>
                  </div>
                </Button>
                <Button onClick={actions.clearResults} variant="outline" className="h-20">
                  <div className="text-center">
                    <RotateCcw className="h-6 w-6 mx-auto mb-2" />
                    <div>Clear Results</div>
                    <div className="text-xs opacity-75">Reset optimization history</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Optimization Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {state.results.map((result) => (
                  <div key={result.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">{result.description}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Improvement:</span>
                        <span className="ml-2 font-medium text-green-600">
                          +{result.improvement.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2 font-medium">{result.duration.toFixed(0)}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rule:</span>
                        <span className="ml-2 font-medium">{result.ruleId}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {state.results.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No optimization results yet. Run an optimization to see results.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Cache Management
              </CardTitle>
              <CardDescription>
                Manage application cache for improved performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Cache Operations</h4>
                  <div className="space-y-2">
                    <Label htmlFor="cache-key">Cache Key</Label>
                    <Input
                      id="cache-key"
                      value={cacheKey}
                      onChange={(e) => setCacheKey(e.target.value)}
                      placeholder="Enter cache key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cache-value">Cache Value</Label>
                    <Textarea
                      id="cache-value"
                      value={cacheValue}
                      onChange={(e) => setCacheValue(e.target.value)}
                      placeholder="Enter cache value"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleCacheSet} className="flex-1">
                      Set Cache
                    </Button>
                    <Button onClick={handleCacheGet} variant="outline" className="flex-1">
                      Get Cache
                    </Button>
                  </div>
                  <Button onClick={actions.cacheClear} variant="destructive" className="w-full">
                    Clear All Cache
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Cache Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cache Size:</span>
                      <span className="text-sm font-medium">{cacheStats.size} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Hit Rate:</span>
                      <span className="text-sm font-medium">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Cache Efficiency:</span>
                        <span className="text-sm font-medium">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={cacheStats.hitRate * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compression" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Compression */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  Image Compression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-file">Select Image</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
                {imageFile && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{imageFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(imageFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
                <Button onClick={handleImageCompress} disabled={!imageFile} className="w-full">
                  Compress Image
                </Button>
              </CardContent>
            </Card>

            {/* Text Compression */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Text Compression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-input">Text to Compress</Label>
                  <Textarea
                    id="text-input"
                    value={textToCompress}
                    onChange={(e) => setTextToCompress(e.target.value)}
                    placeholder="Enter text to compress"
                    rows={4}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleTextCompress} disabled={!textToCompress} className="flex-1">
                    Compress
                  </Button>
                  <Button onClick={handleTextDecompress} disabled={!compressedText} variant="outline" className="flex-1">
                    Decompress
                  </Button>
                </div>
                {compressedText && (
                  <div className="space-y-2">
                    <Label htmlFor="compressed-output">Compressed Output</Label>
                    <Textarea
                      id="compressed-output"
                      value={compressedText}
                      readOnly
                      rows={3}
                      className="font-mono text-xs"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Performance Settings
              </CardTitle>
              <CardDescription>
                Configure performance optimization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">General</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-optimization">Enable Optimization</Label>
                    <Switch
                      id="enable-optimization"
                      checked={state.config.enabled}
                      onCheckedChange={(enabled) => actions.updateConfig({ enabled })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-optimize">Auto Optimize</Label>
                    <Switch
                      id="auto-optimize"
                      checked={state.config.autoOptimize}
                      onCheckedChange={(autoOptimize) => actions.updateConfig({ autoOptimize })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monitoring-interval">Monitoring Interval (ms)</Label>
                  <Slider
                    id="monitoring-interval"
                    min={500}
                    max={5000}
                    step={100}
                    value={[state.config.monitoringInterval]}
                    onValueChange={([value]) => actions.updateConfig({ monitoringInterval: value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: {state.config.monitoringInterval}ms
                  </p>
                </div>
              </div>

              <Separator />

              {/* Lazy Loading Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Lazy Loading</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-lazy-load">Enable Lazy Loading</Label>
                    <Switch
                      id="enable-lazy-load"
                      checked={state.config.lazyLoad.enabled}
                      onCheckedChange={(enabled) => 
                        actions.updateConfig({ 
                          lazyLoad: { ...state.config.lazyLoad, enabled } 
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lazy-threshold">Threshold</Label>
                    <Slider
                      id="lazy-threshold"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[state.config.lazyLoad.threshold]}
                      onValueChange={([threshold]) => 
                        actions.updateConfig({ 
                          lazyLoad: { ...state.config.lazyLoad, threshold } 
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: {state.config.lazyLoad.threshold}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cache Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Cache</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-cache">Enable Cache</Label>
                    <Switch
                      id="enable-cache"
                      checked={state.config.cache.enabled}
                      onCheckedChange={(enabled) => 
                        actions.updateConfig({ 
                          cache: { ...state.config.cache, enabled } 
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cache-strategy">Cache Strategy</Label>
                    <Select
                      value={state.config.cache.strategy}
                      onValueChange={(strategy) => 
                        actions.updateConfig({ 
                          cache: { ...state.config.cache, strategy: strategy as any } 
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lru">LRU (Least Recently Used)</SelectItem>
                        <SelectItem value="lfu">LFU (Least Frequently Used)</SelectItem>
                        <SelectItem value="ttl">TTL (Time To Live)</SelectItem>
                        <SelectItem value="adaptive">Adaptive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cache-max-size">Max Cache Size</Label>
                  <Slider
                    id="cache-max-size"
                    min={10}
                    max={1000}
                    step={10}
                    value={[state.config.cache.maxSize]}
                    onValueChange={([maxSize]) => 
                      actions.updateConfig({ 
                        cache: { ...state.config.cache, maxSize } 
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: {state.config.cache.maxSize} items
                  </p>
                </div>
              </div>

              <Separator />

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Advanced</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-virtualization">Enable Virtualization</Label>
                    <Switch
                      id="enable-virtualization"
                      checked={state.config.enableVirtualization}
                      onCheckedChange={(enableVirtualization) => 
                        actions.updateConfig({ enableVirtualization })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-memoization">Enable Memoization</Label>
                    <Switch
                      id="enable-memoization"
                      checked={state.config.enableMemoization}
                      onCheckedChange={(enableMemoization) => 
                        actions.updateConfig({ enableMemoization })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-debouncing">Enable Debouncing</Label>
                    <Switch
                      id="enable-debouncing"
                      checked={state.config.enableDebouncing}
                      onCheckedChange={(enableDebouncing) => 
                        actions.updateConfig({ enableDebouncing })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-throttling">Enable Throttling</Label>
                    <Switch
                      id="enable-throttling"
                      checked={state.config.enableThrottling}
                      onCheckedChange={(enableThrottling) => 
                        actions.updateConfig({ enableThrottling })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Management */}
              <div className="space-y-4">
                <h4 className="font-medium">Data Management</h4>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      const data = actions.exportData();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'performance-optimization-config.json';
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Configuration exported');
                    }}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Config
                  </Button>
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            try {
                              const data = JSON.parse(e.target?.result as string);
                              actions.importData(data);
                              toast.success('Configuration imported');
                            } catch (error) {
                              toast.error('Failed to import configuration');
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Config
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Errors and Warnings */}
      {(state.errors.length > 0 || state.warnings.length > 0) && (
        <div className="space-y-2">
          {state.errors.map((error, index) => (
            <Alert key={`error-${index}`} variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ))}
          {state.warnings.map((warning, index) => (
            <Alert key={`warning-${index}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizationManager;