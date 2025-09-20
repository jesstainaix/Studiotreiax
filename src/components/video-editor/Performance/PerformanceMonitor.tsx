import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  TrendingUp,
  TrendingDown,
  Gauge,
  Clock,
  Download,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  Thermometer,
  Wifi
} from 'lucide-react';
import { usePerformance } from '@/hooks/usePerformance';
import { PerformanceMetrics, PerformanceAlert, Bottleneck } from '@/types/performance';

interface PerformanceMonitorProps {
  className?: string;
  onOptimizationRequest?: () => void;
  onSettingsOpen?: () => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  onOptimizationRequest,
  onSettingsOpen
}) => {
  const {
    isMonitoring,
    currentMetrics,
    history,
    hardwareInfo,
    bottlenecks,
    alerts,
    recommendations,
    getPerformanceScore,
    startMonitoring,
    stopMonitoring,
    toggleMonitoring,
    optimizeSettings,
    dismissAlert,
    clearAllAlerts,
    exportMetrics
  } = usePerformance({ autoStart: true });

  const [activeTab, setActiveTab] = useState('overview');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const performanceScore = getPerformanceScore();

  // Performance score color and status
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { color: 'text-green-500', status: 'Excellent', icon: CheckCircle };
    if (score >= 60) return { color: 'text-yellow-500', status: 'Good', icon: Activity };
    if (score >= 40) return { color: 'text-orange-500', status: 'Fair', icon: AlertTriangle };
    return { color: 'text-red-500', status: 'Poor', icon: XCircle };
  };

  const scoreStatus = getScoreStatus(performanceScore);
  const ScoreIcon = scoreStatus.icon;

  // Handle optimization
  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await optimizeSettings();
      if (onOptimizationRequest) {
        onOptimizationRequest();
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Get trend indicator
  const getTrendIcon = (current: number, average: number) => {
    if (current > average * 1.1) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (current < average * 0.9) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  // Render metric card
  const MetricCard: React.FC<{
    title: string;
    value: string;
    percentage?: number;
    icon: React.ElementType;
    trend?: React.ReactNode;
    status?: 'good' | 'warning' | 'error';
  }> = ({ title, value, percentage, icon: Icon, trend, status = 'good' }) => {
    const statusColors = {
      good: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50'
    };

    return (
      <Card className={`${statusColors[status]} transition-colors`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{title}</span>
            </div>
            {trend}
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {percentage !== undefined && (
              <Progress 
                value={percentage} 
                className="mt-2 h-2" 
                // @ts-ignore
                indicatorClassName={`${
                  percentage > 80 ? 'bg-red-500' : 
                  percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render alert item
  const AlertItem: React.FC<{ alert: PerformanceAlert }> = ({ alert }) => {
    const alertIcons = {
      info: Activity,
      warning: AlertTriangle,
      error: XCircle
    };
    
    const alertColors = {
      info: 'border-blue-200 bg-blue-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50'
    };

    const AlertIcon = alertIcons[alert.type];

    return (
      <Alert className={`${alertColors[alert.type]} mb-2`}>
        <AlertIcon className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          {alert.title}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissAlert(alert.id)}
            className="h-6 w-6 p-0"
          >
            <XCircle className="h-3 w-3" />
          </Button>
        </AlertTitle>
        <AlertDescription>
          {alert.message}
          <div className="text-xs text-gray-500 mt-1">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // Render bottleneck item
  const BottleneckItem: React.FC<{ bottleneck: Bottleneck }> = ({ bottleneck }) => {
    const severityColors = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900'
    };

    return (
      <Card className="mb-2">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Badge className={severityColors[bottleneck.severity]}>
                {bottleneck.severity.toUpperCase()}
              </Badge>
              <span className="font-medium">{bottleneck.type.toUpperCase()}</span>
            </div>
            <span className="text-sm text-gray-500">
              Impact: {bottleneck.impact}%
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{bottleneck.description}</p>
          {bottleneck.suggestions.length > 0 && (
            <div className="text-xs text-gray-600">
              <strong>Suggestions:</strong>
              <ul className="list-disc list-inside mt-1">
                {bottleneck.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!currentMetrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Monitor</h3>
          <p className="text-gray-600 mb-4">Start monitoring to view performance metrics</p>
          <Button onClick={startMonitoring} className="flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Start Monitoring</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <ScoreIcon className={`w-6 h-6 ${scoreStatus.color}`} />
                <div>
                  <CardTitle className="text-xl">Performance Monitor</CardTitle>
                  <p className="text-sm text-gray-600">
                    Status: <span className={scoreStatus.color}>{scoreStatus.status}</span> 
                    ({performanceScore}/100)
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMonitoring}
                className="flex items-center space-x-2"
              >
                {isMonitoring ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="flex items-center space-x-2"
              >
                {isOptimizing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>Optimize</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onSettingsOpen}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>Active Alerts ({alerts.length})</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllAlerts}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              {alerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="render">Render</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="CPU Usage"
              value={`${currentMetrics.cpu.usage.toFixed(1)}%`}
              percentage={currentMetrics.cpu.usage}
              icon={Cpu}
              trend={getTrendIcon(currentMetrics.cpu.usage, history.averages.cpu)}
              status={currentMetrics.cpu.usage > 80 ? 'error' : currentMetrics.cpu.usage > 60 ? 'warning' : 'good'}
            />
            <MetricCard
              title="Memory"
              value={formatBytes(currentMetrics.memory.used)}
              percentage={currentMetrics.memory.percentage}
              icon={HardDrive}
              trend={getTrendIcon(currentMetrics.memory.percentage, history.averages.memory)}
              status={currentMetrics.memory.percentage > 85 ? 'error' : currentMetrics.memory.percentage > 70 ? 'warning' : 'good'}
            />
            <MetricCard
              title="FPS"
              value={`${currentMetrics.render.fps}`}
              icon={Monitor}
              trend={getTrendIcon(currentMetrics.render.fps, history.averages.fps)}
              status={currentMetrics.render.fps < 24 ? 'error' : currentMetrics.render.fps < 30 ? 'warning' : 'good'}
            />
            <MetricCard
              title="Render Time"
              value={formatTime(currentMetrics.render.averageTime)}
              icon={Clock}
              trend={getTrendIcon(currentMetrics.render.averageTime, history.averages.renderTime)}
              status={currentMetrics.render.averageTime > 100 ? 'error' : currentMetrics.render.averageTime > 50 ? 'warning' : 'good'}
            />
          </div>

          {/* Performance Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gauge className="w-5 h-5" />
                <span>Performance Score</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Progress value={performanceScore} className="h-4" />
                </div>
                <div className="text-2xl font-bold">{performanceScore}/100</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Based on CPU usage, memory consumption, and rendering performance
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {hardwareInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Hardware Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">CPU Cores:</span>
                    <p className="text-lg font-semibold">{hardwareInfo.cpu.cores}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Total Memory:</span>
                    <p className="text-lg font-semibold">{formatBytes(hardwareInfo.memory.total)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">GPU:</span>
                    <p className="text-lg font-semibold">{hardwareInfo.gpu.renderer || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Connection:</span>
                    <p className="text-lg font-semibold flex items-center space-x-1">
                      <Wifi className="w-4 h-4" />
                      <span>{hardwareInfo.network.effectiveType || 'Unknown'}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Thermometer className="w-5 h-5" />
                  <span>CPU Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Usage:</span>
                  <span className="font-semibold">{currentMetrics.cpu.usage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Cores:</span>
                  <span className="font-semibold">{hardwareInfo?.cpu.cores || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Architecture:</span>
                  <span className="font-semibold">{hardwareInfo?.cpu.architecture || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5" />
                  <span>Memory Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Used:</span>
                  <span className="font-semibold">{formatBytes(currentMetrics.memory.used)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-semibold">{formatBytes(currentMetrics.memory.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage:</span>
                  <span className="font-semibold">{currentMetrics.memory.percentage.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="render" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Current FPS"
              value={`${currentMetrics.render.fps}`}
              icon={Monitor}
              status={currentMetrics.render.fps < 24 ? 'error' : currentMetrics.render.fps < 30 ? 'warning' : 'good'}
            />
            <MetricCard
              title="Avg Render Time"
              value={formatTime(currentMetrics.render.averageTime)}
              icon={Clock}
              status={currentMetrics.render.averageTime > 100 ? 'error' : currentMetrics.render.averageTime > 50 ? 'warning' : 'good'}
            />
            <MetricCard
              title="Dropped Frames"
              value={`${currentMetrics.render.droppedFrames}`}
              icon={XCircle}
              status={currentMetrics.render.droppedFrames > 10 ? 'error' : currentMetrics.render.droppedFrames > 5 ? 'warning' : 'good'}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Render Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Average FPS:</span>
                  <span className="font-semibold">{history.averages.fps.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Peak FPS:</span>
                  <span className="font-semibold">{history.peaks.minFps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Render Time:</span>
                  <span className="font-semibold">{formatTime(history.averages.renderTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Max Render Time:</span>
                  <span className="font-semibold">{formatTime(history.peaks.maxRenderTime)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {bottlenecks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Detected Bottlenecks ({bottlenecks.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {bottlenecks.map(bottleneck => (
                    <BottleneckItem key={bottleneck.id} bottleneck={bottleneck} />
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Detected</h3>
                <p className="text-gray-600">Your system is performing optimally</p>
              </CardContent>
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <span>Performance Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map(rec => (
                    <Alert key={rec.id} className="border-blue-200 bg-blue-50">
                      <BarChart3 className="h-4 w-4" />
                      <AlertTitle>{rec.title}</AlertTitle>
                      <AlertDescription>
                        {rec.description}
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Impact: {rec.impact}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Export Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Export Performance Data</h4>
              <p className="text-sm text-gray-600">Download detailed performance metrics</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const data = exportMetrics();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-metrics-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;