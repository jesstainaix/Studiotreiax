import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  HardDrive,
  Monitor,
  Clock,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Maximize2,
  Minimize2,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { usePerformance } from '@/hooks/usePerformance';
import { PerformanceMetrics, PerformanceHistory } from '@/types/performance';

interface PerformanceChartsProps {
  className?: string;
  showControls?: boolean;
  height?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ChartDataPoint {
  timestamp: string;
  time: number;
  cpu: number;
  memory: number;
  gpu?: number;
  fps: number;
  renderTime: number;
  cacheHits: number;
  cacheMisses: number;
  bottlenecks: number;
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  className = '',
  showControls = true,
  height = 300,
  autoRefresh = true,
  refreshInterval = 1000
}) => {
  const {
    currentMetrics,
    performanceHistory,
    bottlenecks,
    isMonitoring
  } = usePerformance();

  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('5m');
  const [chartType, setChartType] = useState('line');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [smoothLines, setSmoothLines] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState({
    cpu: true,
    memory: true,
    gpu: false,
    fps: true,
    renderTime: true
  });

  // Process performance history data
  const chartData = useMemo(() => {
    if (!performanceHistory || performanceHistory.length === 0) {
      return [];
    }

    const now = Date.now();
    const timeRangeMs = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '3h': 3 * 60 * 60 * 1000
    }[timeRange] || 5 * 60 * 1000;

    return performanceHistory
      .filter(entry => now - entry.timestamp <= timeRangeMs)
      .map((entry, index) => ({
        timestamp: new Date(entry.timestamp).toLocaleTimeString(),
        time: entry.timestamp,
        cpu: entry.metrics.cpu.usage,
        memory: entry.metrics.memory.percentage,
        gpu: entry.metrics.gpu?.usage || 0,
        fps: entry.metrics.render.fps,
        renderTime: entry.metrics.render.averageTime,
        cacheHits: entry.metrics.cache.hits,
        cacheMisses: entry.metrics.cache.misses,
        bottlenecks: entry.bottlenecks.length
      }));
  }, [performanceHistory, timeRange]);

  // Calculate performance statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgCpu: 0,
        avgMemory: 0,
        avgFps: 0,
        avgRenderTime: 0,
        maxCpu: 0,
        maxMemory: 0,
        minFps: 0,
        totalBottlenecks: 0
      };
    }

    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    return {
      avgCpu: chartData.reduce((sum, d) => sum + d.cpu, 0) / chartData.length,
      avgMemory: chartData.reduce((sum, d) => sum + d.memory, 0) / chartData.length,
      avgFps: chartData.reduce((sum, d) => sum + d.fps, 0) / chartData.length,
      avgRenderTime: chartData.reduce((sum, d) => sum + d.renderTime, 0) / chartData.length,
      maxCpu: Math.max(...chartData.map(d => d.cpu)),
      maxMemory: Math.max(...chartData.map(d => d.memory)),
      minFps: Math.min(...chartData.map(d => d.fps)),
      totalBottlenecks: chartData.reduce((sum, d) => sum + d.bottlenecks, 0),
      cpuTrend: previous ? latest.cpu - previous.cpu : 0,
      memoryTrend: previous ? latest.memory - previous.memory : 0,
      fpsTrend: previous ? latest.fps - previous.fps : 0
    };
  }, [chartData]);

  // Memory usage breakdown data
  const memoryBreakdown = useMemo(() => {
    if (!currentMetrics) return [];

    const total = currentMetrics.memory.total;
    const used = currentMetrics.memory.used;
    const available = total - used;

    return [
      { name: 'Used', value: used, color: '#ef4444' },
      { name: 'Available', value: available, color: '#22c55e' }
    ];
  }, [currentMetrics]);

  // Bottleneck severity data
  const bottleneckData = useMemo(() => {
    const severityCounts = bottlenecks.reduce((acc, bottleneck) => {
      acc[bottleneck.severity] = (acc[bottleneck.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
      color: {
        low: '#22c55e',
        medium: '#f59e0b',
        high: '#ef4444',
        critical: '#dc2626'
      }[severity] || '#6b7280'
    }));
  }, [bottlenecks]);

  // Export chart data
  const handleExportData = () => {
    const exportData = {
      timestamp: Date.now(),
      timeRange,
      data: chartData,
      stats,
      bottlenecks: bottlenecks.map(b => ({
        type: b.type,
        severity: b.severity,
        description: b.description,
        timestamp: b.timestamp
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              {entry.name === 'CPU' || entry.name === 'Memory' ? '%' : 
               entry.name === 'Render Time' ? 'ms' : 
               entry.name === 'FPS' ? ' fps' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Metric card component
  const MetricCard: React.FC<{
    title: string;
    value: number;
    unit: string;
    trend?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, unit, trend, icon, color }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm text-gray-600">{title}</p>
              <p className="text-2xl font-bold">
                {value.toFixed(1)}{unit}
              </p>
            </div>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${
              trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-500'
            }`}>
              {trend > 0 ? <TrendingUp className="w-4 h-4" /> : 
               trend < 0 ? <TrendingDown className="w-4 h-4" /> : 
               <Activity className="w-4 h-4" />}
              <span>{Math.abs(trend).toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-4 ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      {/* Header */}
      {showControls && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6" />
                <div>
                  <CardTitle>Performance Analytics</CardTitle>
                  <p className="text-sm text-gray-600">
                    Real-time performance monitoring and analysis
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={isMonitoring ? "default" : "secondary"}
                  className={isMonitoring ? "bg-green-500" : ""}
                >
                  {isMonitoring ? 'Monitoring' : 'Stopped'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Controls */}
      {showControls && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Label>Time Range:</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1m</SelectItem>
                    <SelectItem value="5m">5m</SelectItem>
                    <SelectItem value="15m">15m</SelectItem>
                    <SelectItem value="30m">30m</SelectItem>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="3h">3h</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Label>Chart Type:</Label>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="composed">Composed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                  id="show-grid"
                />
                <Label htmlFor="show-grid">Grid</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={smoothLines}
                  onCheckedChange={setSmoothLines}
                  id="smooth-lines"
                />
                <Label htmlFor="smooth-lines">Smooth</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={stats.avgCpu}
          unit="%"
          trend={stats.cpuTrend}
          icon={<Cpu className="w-5 h-5 text-white" />}
          color="bg-blue-500"
        />
        <MetricCard
          title="Memory Usage"
          value={stats.avgMemory}
          unit="%"
          trend={stats.memoryTrend}
          icon={<HardDrive className="w-5 h-5 text-white" />}
          color="bg-green-500"
        />
        <MetricCard
          title="Frame Rate"
          value={stats.avgFps}
          unit=" fps"
          trend={stats.fpsTrend}
          icon={<Monitor className="w-5 h-5 text-white" />}
          color="bg-purple-500"
        />
        <MetricCard
          title="Render Time"
          value={stats.avgRenderTime}
          unit="ms"
          icon={<Clock className="w-5 h-5 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Main Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={height}>
                {chartType === 'line' && (
                  <LineChart data={chartData}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {selectedMetrics.cpu && (
                      <Line
                        type={smoothLines ? "monotone" : "linear"}
                        dataKey="cpu"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="CPU"
                        dot={false}
                      />
                    )}
                    {selectedMetrics.memory && (
                      <Line
                        type={smoothLines ? "monotone" : "linear"}
                        dataKey="memory"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Memory"
                        dot={false}
                      />
                    )}
                    {selectedMetrics.fps && (
                      <Line
                        type={smoothLines ? "monotone" : "linear"}
                        dataKey="fps"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="FPS"
                        dot={false}
                      />
                    )}
                  </LineChart>
                )}
                {chartType === 'area' && (
                  <AreaChart data={chartData}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {selectedMetrics.cpu && (
                      <Area
                        type={smoothLines ? "monotone" : "linear"}
                        dataKey="cpu"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        name="CPU"
                      />
                    )}
                    {selectedMetrics.memory && (
                      <Area
                        type={smoothLines ? "monotone" : "linear"}
                        dataKey="memory"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                        name="Memory"
                      />
                    )}
                  </AreaChart>
                )}
                {chartType === 'bar' && (
                  <BarChart data={chartData.slice(-20)}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {selectedMetrics.cpu && (
                      <Bar dataKey="cpu" fill="#3b82f6" name="CPU" />
                    )}
                    {selectedMetrics.memory && (
                      <Bar dataKey="memory" fill="#10b981" name="Memory" />
                    )}
                  </BarChart>
                )}
                {chartType === 'composed' && (
                  <ComposedChart data={chartData}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="cpu"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      stroke="#3b82f6"
                      name="CPU"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="fps"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="FPS"
                      dot={false}
                    />
                    <Bar yAxisId="left" dataKey="renderTime" fill="#f59e0b" name="Render Time" />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>CPU & Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="CPU %"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Memory %"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Render Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="renderTime"
                      fill="#f59e0b"
                      name="Render Time (ms)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="fps"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="FPS"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                  <PieChart>
                    <Pie
                      data={memoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {memoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                        'Memory'
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="cacheHits"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      name="Cache Hits"
                    />
                    <Area
                      type="monotone"
                      dataKey="cacheMisses"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      name="Cache Misses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bottleneck Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                  <PieChart>
                    <Pie
                      data={bottleneckData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {bottleneckData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bottleneck Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="bottlenecks"
                      fill="#ef4444"
                      name="Bottlenecks"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bottlenecks List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bottlenecks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bottlenecks.slice(0, 10).map(bottleneck => (
                  <div
                    key={bottleneck.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded ${
                        bottleneck.severity === 'critical' ? 'bg-red-100 text-red-600' :
                        bottleneck.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                        bottleneck.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {bottleneck.severity === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                         bottleneck.severity === 'high' ? <AlertTriangle className="w-4 h-4" /> :
                         bottleneck.severity === 'medium' ? <Info className="w-4 h-4" /> :
                         <CheckCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{bottleneck.type}</p>
                        <p className="text-sm text-gray-600">{bottleneck.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={bottleneck.severity === 'critical' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {bottleneck.severity}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(bottleneck.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {bottlenecks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No bottlenecks detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceCharts;