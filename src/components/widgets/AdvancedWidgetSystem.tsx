import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Database,
  Download,
  Edit3,
  Eye,
  Filter,
  Grid3X3,
  Layout,
  LineChart,
  Maximize2,
  Minimize2,
  Monitor,
  MoreVertical,
  Move,
  Palette,
  PieChart,
  Plus,
  RefreshCw,
  Save,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
  X,
  Zap,
  Target,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
  ScatterChart
} from 'recharts';

// Interfaces para sistema de widgets avançado
interface WidgetData {
  id: string;
  type: 'metric' | 'chart' | 'progress' | 'list' | 'calendar' | 'map' | 'gauge' | 'table' | 'image' | 'text';
  title: string;
  description?: string;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
  data: any;
  isVisible: boolean;
  isLocked: boolean;
  refreshInterval?: number;
  lastUpdated: number;
  theme: WidgetTheme;
  permissions: WidgetPermissions;
}

interface WidgetConfig {
  dataSource: string;
  query?: string;
  filters?: Record<string, any>;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  timeRange?: '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d';
  chartType?: 'line' | 'area' | 'bar' | 'pie' | 'radial' | 'scatter' | 'composed';
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  threshold?: { warning: number; critical: number; target?: number };
  colors?: string[];
  animation?: boolean;
  realTime?: boolean;
  customFormat?: string;
  displayMode?: 'value' | 'percentage' | 'delta' | 'trend';
}

interface WidgetTheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  opacity: number;
  borderRadius: number;
  shadow: boolean;
}

interface WidgetPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canMove: boolean;
  canResize: boolean;
  canShare: boolean;
}

interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: WidgetData[];
  isDefault: boolean;
  isShared: boolean;
  createdAt: number;
  updatedAt: number;
}

interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: WidgetData['type'];
  defaultConfig: WidgetConfig;
  defaultTheme: WidgetTheme;
  preview: string;
}

const AdvancedWidgetSystem: React.FC = () => {
  // Estados principais
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<string>('default');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [gridSize, setGridSize] = useState({ cols: 12, rows: 8 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  // Templates de widgets disponíveis
  const widgetTemplates: WidgetTemplate[] = useMemo(() => [
    {
      id: 'users-metric',
      name: 'Usuários Ativos',
      description: 'Mostra o número de usuários ativos em tempo real',
      category: 'Métricas',
      type: 'metric',
      defaultConfig: {
        dataSource: 'users',
        realTime: true,
        displayMode: 'value',
        threshold: { warning: 1000, critical: 1500 }
      },
      defaultTheme: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        accentColor: '#3b82f6',
        opacity: 1,
        borderRadius: 8,
        shadow: true
      },
      preview: '/previews/users-metric.png'
    },
    {
      id: 'performance-chart',
      name: 'Gráfico de Performance',
      description: 'Gráfico de linha mostrando métricas de performance',
      category: 'Gráficos',
      type: 'chart',
      defaultConfig: {
        dataSource: 'performance',
        chartType: 'line',
        timeRange: '24h',
        showLegend: true,
        showGrid: true,
        animation: true
      },
      defaultTheme: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        accentColor: '#10b981',
        opacity: 1,
        borderRadius: 8,
        shadow: true
      },
      preview: '/previews/performance-chart.png'
    },
    {
      id: 'storage-progress',
      name: 'Uso de Armazenamento',
      description: 'Barra de progresso mostrando uso de armazenamento',
      category: 'Indicadores',
      type: 'progress',
      defaultConfig: {
        dataSource: 'storage',
        threshold: { warning: 80, critical: 95 },
        displayMode: 'percentage'
      },
      defaultTheme: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        accentColor: '#f59e0b',
        opacity: 1,
        borderRadius: 8,
        shadow: true
      },
      preview: '/previews/storage-progress.png'
    },
    {
      id: 'activity-list',
      name: 'Lista de Atividades',
      description: 'Lista das atividades recentes do sistema',
      category: 'Listas',
      type: 'list',
      defaultConfig: {
        dataSource: 'activities',
        timeRange: '24h'
      },
      defaultTheme: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        accentColor: '#8b5cf6',
        opacity: 1,
        borderRadius: 8,
        shadow: true
      },
      preview: '/previews/activity-list.png'
    },
    {
      id: 'system-gauge',
      name: 'Medidor do Sistema',
      description: 'Medidor circular para métricas do sistema',
      category: 'Medidores',
      type: 'gauge',
      defaultConfig: {
        dataSource: 'system',
        threshold: { warning: 70, critical: 90, target: 50 }
      },
      defaultTheme: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        accentColor: '#ef4444',
        opacity: 1,
        borderRadius: 8,
        shadow: true
      },
      preview: '/previews/system-gauge.png'
    }
  ], []);

  // Dados simulados para widgets
  const generateWidgetData = useCallback((dataSource: string, config: WidgetConfig) => {
    switch (dataSource) {
      case 'users':
        return {
          value: Math.floor(Math.random() * 500) + 1200,
          unit: 'usuários',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          change: (Math.random() * 20 - 10).toFixed(1)
        };
      
      case 'performance':
        const hours = 24;
        return Array.from({ length: hours }, (_, i) => ({
          time: new Date(Date.now() - (hours - i) * 60 * 60 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          value: Math.floor(Math.random() * 100) + 50,
          secondary: Math.floor(Math.random() * 80) + 40
        }));
      
      case 'storage':
        return {
          used: Math.floor(Math.random() * 30) + 65,
          total: 100,
          available: 35 - Math.floor(Math.random() * 30)
        };
      
      case 'activities':
        return Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          title: `Atividade ${i + 1}`,
          description: `Descrição da atividade ${i + 1}`,
          timestamp: Date.now() - i * 30 * 60 * 1000,
          type: ['info', 'success', 'warning', 'error'][Math.floor(Math.random() * 4)],
          user: `Usuário ${i + 1}`
        }));
      
      case 'system':
        return {
          cpu: Math.floor(Math.random() * 40) + 30,
          memory: Math.floor(Math.random() * 30) + 50,
          disk: Math.floor(Math.random() * 20) + 65,
          network: Math.floor(Math.random() * 50) + 25
        };
      
      default:
        return { value: Math.floor(Math.random() * 100) };
    }
  }, []);

  // Widgets padrão
  const defaultWidgets: WidgetData[] = useMemo(() => [
    {
      id: 'widget-1',
      type: 'metric',
      title: 'Usuários Ativos',
      size: 'sm',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {
        dataSource: 'users',
        realTime: true,
        displayMode: 'value'
      },
      data: generateWidgetData('users', { dataSource: 'users' }),
      isVisible: true,
      isLocked: false,
      lastUpdated: Date.now(),
      theme: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        accentColor: '#3b82f6',
        opacity: 1,
        borderRadius: 8,
        shadow: true
      },
      permissions: {
        canEdit: true,
        canDelete: true,
        canMove: true,
        canResize: true,
        canShare: true
      }
    },
    {
      id: 'widget-2',
      type: 'chart',
      title: 'Performance do Sistema',
      size: 'lg',
      position: { x: 3, y: 0, w: 6, h: 4 },
      config: {
        dataSource: 'performance',
        chartType: 'line',
        timeRange: '24h',
        showLegend: true,
        showGrid: true
      },
      data: generateWidgetData('performance', { dataSource: 'performance' }),
      isVisible: true,
      isLocked: false,
      lastUpdated: Date.now(),
      theme: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        accentColor: '#10b981',
        opacity: 1,
        borderRadius: 8,
        shadow: true
      },
      permissions: {
        canEdit: true,
        canDelete: true,
        canMove: true,
        canResize: true,
        canShare: true
      }
    },
    {
      id: 'widget-3',
      type: 'progress',
      title: 'Uso de Armazenamento',
      size: 'sm',
      position: { x: 9, y: 0, w: 3, h: 2 },
      config: {
        dataSource: 'storage',
        threshold: { warning: 80, critical: 95 }
      },
      data: generateWidgetData('storage', { dataSource: 'storage' }),
      isVisible: true,
      isLocked: false,
      lastUpdated: Date.now(),
      theme: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        accentColor: '#f59e0b',
        opacity: 1,
        borderRadius: 8,
        shadow: true
      },
      permissions: {
        canEdit: true,
        canDelete: true,
        canMove: true,
        canResize: true,
        canShare: true
      }
    }
  ], [generateWidgetData]);

  // Inicialização
  useEffect(() => {
    setWidgets(defaultWidgets);
    
    const defaultLayout: DashboardLayout = {
      id: 'default',
      name: 'Layout Padrão',
      description: 'Layout padrão do dashboard',
      widgets: defaultWidgets,
      isDefault: true,
      isShared: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setLayouts([defaultLayout]);
  }, [defaultWidgets]);

  // Auto-refresh dos dados
  useEffect(() => {
    const interval = setInterval(() => {
      setWidgets(prev => prev.map(widget => {
        if (widget.config.realTime) {
          return {
            ...widget,
            data: generateWidgetData(widget.config.dataSource, widget.config),
            lastUpdated: Date.now()
          };
        }
        return widget;
      }));
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, [generateWidgetData]);

  // Funções de manipulação de widgets
  const addWidget = useCallback((template: WidgetTemplate) => {
    const newWidget: WidgetData = {
      id: `widget-${Date.now()}`,
      type: template.type,
      title: template.name,
      size: 'md',
      position: { x: 0, y: 0, w: 4, h: 3 },
      config: template.defaultConfig,
      data: generateWidgetData(template.defaultConfig.dataSource, template.defaultConfig),
      isVisible: true,
      isLocked: false,
      lastUpdated: Date.now(),
      theme: template.defaultTheme,
      permissions: {
        canEdit: true,
        canDelete: true,
        canMove: true,
        canResize: true,
        canShare: true
      }
    };
    
    setWidgets(prev => [...prev, newWidget]);
    setShowWidgetLibrary(false);
    toast.success(`Widget "${template.name}" adicionado`);
  }, [generateWidgetData]);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    toast.success('Widget removido');
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetData>) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, ...updates, lastUpdated: Date.now() } : w
    ));
  }, []);

  const duplicateWidget = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      const duplicated: WidgetData = {
        ...widget,
        id: `widget-${Date.now()}`,
        title: `${widget.title} (Cópia)`,
        position: { ...widget.position, x: widget.position.x + 1, y: widget.position.y + 1 }
      };
      setWidgets(prev => [...prev, duplicated]);
      toast.success('Widget duplicado');
    }
  }, [widgets]);

  // Renderização de widgets
  const renderWidget = useCallback((widget: WidgetData) => {
    const sizeClasses = {
      xs: 'col-span-1 row-span-1',
      sm: 'col-span-2 row-span-2',
      md: 'col-span-3 row-span-3',
      lg: 'col-span-4 row-span-4',
      xl: 'col-span-6 row-span-4',
      full: 'col-span-full row-span-6'
    };

    const widgetStyle = {
      backgroundColor: widget.theme.backgroundColor,
      color: widget.theme.textColor,
      borderColor: widget.theme.borderColor,
      opacity: widget.theme.opacity,
      borderRadius: `${widget.theme.borderRadius}px`,
      boxShadow: widget.theme.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
    };

    return (
      <Card 
        key={widget.id} 
        className={`${sizeClasses[widget.size]} relative group transition-all duration-200 hover:scale-105`}
        style={widgetStyle}
        draggable={isEditMode && widget.permissions.canMove}
        onDragStart={() => setDraggedWidget(widget.id)}
        onDragEnd={() => setDraggedWidget(null)}
      >
        {/* Controles de edição */}
        {isEditMode && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              {widget.permissions.canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedWidget(widget.id)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => duplicateWidget(widget.id)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              
              {widget.permissions.canDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeWidget(widget.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Indicador de bloqueio */}
        {widget.isLocked && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="text-xs">
              Bloqueado
            </Badge>
          </div>
        )}

        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {widget.title}
            <div className="flex items-center space-x-1">
              {widget.config.realTime && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
              <span className="text-xs text-gray-500">
                {new Date(widget.lastUpdated).toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Renderização baseada no tipo */}
          {widget.type === 'metric' && (
            <div className="space-y-2">
              <div className="text-2xl font-bold" style={{ color: widget.theme.accentColor }}>
                {widget.data.value?.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {widget.data.unit}
                </span>
              </div>
              
              <div className="flex items-center space-x-1 text-sm">
                {widget.data.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={widget.data.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {widget.data.change > 0 ? '+' : ''}{widget.data.change}%
                </span>
              </div>
            </div>
          )}

          {widget.type === 'chart' && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                {widget.config.chartType === 'line' && (
                  <RechartsLineChart data={widget.data}>
                    {widget.config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                    <XAxis dataKey="time" />
                    <YAxis />
                    {widget.config.showTooltip && <Tooltip />}
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={widget.theme.accentColor} 
                      strokeWidth={2}
                      dot={false}
                      animationDuration={widget.config.animation ? 1000 : 0}
                    />
                  </RechartsLineChart>
                )}
                
                {widget.config.chartType === 'area' && (
                  <AreaChart data={widget.data}>
                    {widget.config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                    <XAxis dataKey="time" />
                    <YAxis />
                    {widget.config.showTooltip && <Tooltip />}
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={widget.theme.accentColor}
                      fill={widget.theme.accentColor}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                )}
                
                {widget.config.chartType === 'bar' && (
                  <BarChart data={widget.data}>
                    {widget.config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                    <XAxis dataKey="time" />
                    <YAxis />
                    {widget.config.showTooltip && <Tooltip />}
                    <Bar 
                      dataKey="value" 
                      fill={widget.theme.accentColor}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {widget.type === 'progress' && (
            <div className="space-y-3">
              <Progress 
                value={widget.data.used} 
                className="h-3"
                style={{ 
                  '--progress-background': widget.theme.accentColor 
                } as React.CSSProperties}
              />
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>{widget.data.used}% usado</span>
                <span>{widget.data.available}% disponível</span>
              </div>
              
              {widget.config.threshold && widget.data.used > widget.config.threshold.warning && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {widget.data.used > widget.config.threshold.critical ? 
                      'Uso crítico!' : 
                      'Uso alto'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {widget.type === 'list' && (
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {widget.data.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.type === 'error' ? 'bg-red-500' :
                      item.type === 'warning' ? 'bg-yellow-500' :
                      item.type === 'success' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {widget.type === 'gauge' && (
            <div className="flex items-center justify-center h-32">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={widget.theme.accentColor}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - (widget.data.cpu || 0) / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: widget.theme.accentColor }}>
                    {widget.data.cpu || 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [isEditMode, selectedWidget, duplicateWidget, removeWidget]);

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Widgets Avançado</h1>
          <p className="text-gray-600">Personalize seu dashboard com widgets inteligentes</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowLayoutManager(true)}
          >
            <Layout className="h-4 w-4 mr-2" />
            Layouts
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            {isEditMode ? 'Visualizar' : 'Editar'}
          </Button>

          {isEditMode && (
            <Button onClick={() => setShowWidgetLibrary(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Widget
            </Button>
          )}
        </div>
      </div>

      {/* Informações do modo de edição */}
      {isEditMode && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Modo de edição ativo. Arraste widgets para reposicionar, use os controles para editar ou remover.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de widgets */}
      <div className={`grid gap-4 transition-all duration-300 ${
        gridSize.cols === 12 ? 'grid-cols-12' : 'grid-cols-8'
      }`}>
        {widgets.filter(w => w.isVisible).map(renderWidget)}
      </div>

      {/* Biblioteca de widgets */}
      {showWidgetLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-4/5 max-w-4xl max-h-4/5 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Biblioteca de Widgets
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWidgetLibrary(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {widgetTemplates.map(template => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => addWidget(template)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Editor de widget */}
      {selectedWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Editar Widget
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWidget(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Configurações básicas */}
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={widgets.find(w => w.id === selectedWidget)?.title || ''}
                  onChange={(e) => updateWidget(selectedWidget, { title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tamanho</label>
                <Select
                  value={widgets.find(w => w.id === selectedWidget)?.size || 'md'}
                  onValueChange={(value) => updateWidget(selectedWidget, { size: value as WidgetData['size'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xs">Extra Pequeno</SelectItem>
                    <SelectItem value="sm">Pequeno</SelectItem>
                    <SelectItem value="md">Médio</SelectItem>
                    <SelectItem value="lg">Grande</SelectItem>
                    <SelectItem value="xl">Extra Grande</SelectItem>
                    <SelectItem value="full">Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={() => setSelectedWidget(null)}
                className="w-full"
              >
                Salvar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvancedWidgetSystem;