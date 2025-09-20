import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  Database,
  Download,
  Edit3,
  Eye,
  Filter,
  Globe,
  Grid3X3,
  Layout,
  LineChart,
  Monitor,
  Plus,
  RefreshCw,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
  Zap,
  X,
  Maximize2,
  Minimize2,
  MoreVertical
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
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';

// Interfaces para widgets personalizáveis
interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'alert' | 'activity' | 'kpi' | 'progress';
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  config: WidgetConfig;
  isVisible: boolean;
  refreshInterval?: number;
}

interface WidgetConfig {
  metricKey?: string;
  chartType?: 'line' | 'area' | 'bar' | 'pie' | 'radial';
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  threshold?: { warning: number; critical: number };
  color?: string;
  showTrend?: boolean;
  showComparison?: boolean;
  dataSource?: string;
  filters?: Record<string, any>;
}

interface DashboardMetric {
  key: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  category: 'performance' | 'users' | 'content' | 'system' | 'business';
  icon: React.ReactNode;
  color: string;
  timestamp: number;
}

interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  actionUrl?: string;
}

const EnhancedDashboardHub: React.FC = () => {
  // Estados principais
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [dashboardLayout, setDashboardLayout] = useState<'grid' | 'masonry' | 'custom'>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Métricas em tempo real simuladas
  const generateRealTimeMetrics = useCallback((): DashboardMetric[] => {
    const baseMetrics = [
      {
        key: 'active_users',
        name: 'Usuários Ativos',
        value: Math.floor(Math.random() * 500) + 1200,
        unit: 'users',
        category: 'users' as const,
        icon: <Users className="h-4 w-4" />,
        color: 'text-blue-600'
      },
      {
        key: 'videos_created',
        name: 'Vídeos Criados Hoje',
        value: Math.floor(Math.random() * 50) + 120,
        unit: 'videos',
        category: 'content' as const,
        icon: <Video className="h-4 w-4" />,
        color: 'text-green-600'
      },
      {
        key: 'render_time',
        name: 'Tempo Médio de Render',
        value: Math.floor(Math.random() * 30) + 45,
        unit: 'seconds',
        category: 'performance' as const,
        icon: <Clock className="h-4 w-4" />,
        color: 'text-orange-600'
      },
      {
        key: 'storage_used',
        name: 'Armazenamento Usado',
        value: Math.floor(Math.random() * 20) + 65,
        unit: '%',
        category: 'system' as const,
        icon: <Database className="h-4 w-4" />,
        color: 'text-purple-600'
      },
      {
        key: 'conversion_rate',
        name: 'Taxa de Conversão',
        value: (Math.random() * 2 + 3.5),
        unit: '%',
        category: 'business' as const,
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'text-emerald-600'
      },
      {
        key: 'api_response_time',
        name: 'Tempo de Resposta API',
        value: Math.floor(Math.random() * 50) + 120,
        unit: 'ms',
        category: 'performance' as const,
        icon: <Zap className="h-4 w-4" />,
        color: 'text-yellow-600'
      }
    ];

    return baseMetrics.map(metric => {
      const previousValue = metric.value * (0.9 + Math.random() * 0.2);
      const change = ((metric.value - previousValue) / previousValue) * 100;
      const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';

      return {
        ...metric,
        value: Number(metric.value.toFixed(2)),
        change: Number(change.toFixed(1)),
        trend,
        timestamp: Date.now()
      };
    });
  }, []);

  // Widgets padrão do dashboard
  const defaultWidgets: Widget[] = useMemo(() => [
    {
      id: 'users-widget',
      type: 'metric',
      title: 'Usuários Ativos',
      size: 'small',
      position: { x: 0, y: 0 },
      config: { metricKey: 'active_users', showTrend: true, color: 'blue' },
      isVisible: true
    },
    {
      id: 'videos-widget',
      type: 'metric',
      title: 'Vídeos Criados',
      size: 'small',
      position: { x: 1, y: 0 },
      config: { metricKey: 'videos_created', showTrend: true, color: 'green' },
      isVisible: true
    },
    {
      id: 'performance-chart',
      type: 'chart',
      title: 'Performance do Sistema',
      size: 'large',
      position: { x: 0, y: 1 },
      config: { chartType: 'line', timeRange: '24h', metricKey: 'render_time' },
      isVisible: true
    },
    {
      id: 'storage-progress',
      type: 'progress',
      title: 'Uso de Armazenamento',
      size: 'medium',
      position: { x: 2, y: 0 },
      config: { metricKey: 'storage_used', threshold: { warning: 80, critical: 95 } },
      isVisible: true
    },
    {
      id: 'notifications-widget',
      type: 'alert',
      title: 'Notificações',
      size: 'medium',
      position: { x: 0, y: 2 },
      config: { showTrend: false },
      isVisible: true
    }
  ], []);

  // Inicialização
  useEffect(() => {
    setWidgets(defaultWidgets);
    setMetrics(generateRealTimeMetrics());
    
    // Gerar notificações simuladas
    const mockNotifications: NotificationItem[] = [
      {
        id: '1',
        type: 'info',
        title: 'Novo template disponível',
        message: 'Template para NR-35 foi adicionado à biblioteca',
        timestamp: Date.now() - 300000,
        isRead: false
      },
      {
        id: '2',
        type: 'warning',
        title: 'Uso de armazenamento alto',
        message: 'Armazenamento está em 85% da capacidade',
        timestamp: Date.now() - 600000,
        isRead: false
      },
      {
        id: '3',
        type: 'success',
        title: 'Render concluído',
        message: 'Vídeo "Treinamento NR-12" foi renderizado com sucesso',
        timestamp: Date.now() - 900000,
        isRead: true
      }
    ];
    setNotifications(mockNotifications);
  }, [defaultWidgets, generateRealTimeMetrics]);

  // Auto-refresh das métricas
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(generateRealTimeMetrics());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, generateRealTimeMetrics]);

  // Funções de manipulação de widgets
  const addWidget = useCallback((type: Widget['type']) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: `Novo Widget ${type}`,
      size: 'medium',
      position: { x: 0, y: widgets.length },
      config: {},
      isVisible: true
    };
    setWidgets(prev => [...prev, newWidget]);
  }, [widgets.length]);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...updates } : w));
  }, []);

  // Renderização de widgets
  const renderWidget = useCallback((widget: Widget) => {
    const metric = metrics.find(m => m.key === widget.config.metricKey);
    const sizeClasses = {
      small: 'col-span-1 row-span-1',
      medium: 'col-span-2 row-span-1',
      large: 'col-span-3 row-span-2',
      full: 'col-span-full row-span-2'
    };

    return (
      <Card key={widget.id} className={`${sizeClasses[widget.size]} relative group`}>
        {isEditMode && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedWidget(widget.id)}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeWidget(widget.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {widget.title}
            {widget.type === 'metric' && metric && (
              <div className={`p-1 rounded ${metric.color}`}>
                {metric.icon}
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {widget.type === 'metric' && metric && (
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {metric.value.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {metric.unit}
                </span>
              </div>
              {widget.config.showTrend && (
                <div className="flex items-center space-x-1 text-sm">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <div className="h-3 w-3" />
                  )}
                  <span className={`${
                    metric.trend === 'up' ? 'text-green-600' :
                    metric.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
              )}
            </div>
          )}

          {widget.type === 'progress' && metric && (
            <div className="space-y-3">
              <Progress 
                value={metric.value} 
                className="h-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{metric.value}% usado</span>
                <span>{100 - metric.value}% disponível</span>
              </div>
              {widget.config.threshold && metric.value > widget.config.threshold.warning && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {metric.value > widget.config.threshold.critical ? 
                      'Uso crítico de armazenamento!' : 
                      'Uso alto de armazenamento'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {widget.type === 'alert' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notificações</span>
                <Badge variant="secondary">
                  {notifications.filter(n => !n.isRead).length}
                </Badge>
              </div>
              <ScrollArea className="h-32">
                {notifications.slice(0, 3).map(notification => (
                  <div key={notification.id} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'error' ? 'bg-red-500' :
                      notification.type === 'warning' ? 'bg-yellow-500' :
                      notification.type === 'success' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {widget.type === 'chart' && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={generateChartData(widget.config.metricKey || 'render_time')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={widget.config.color || '#3b82f6'} 
                    strokeWidth={2}
                    dot={false}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [metrics, notifications, isEditMode, removeWidget, generateChartData]);

  // Gerar dados para gráficos
  const generateChartData = useCallback((metricKey: string) => {
    const now = Date.now();
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now - i * 60 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        value: Math.floor(Math.random() * 100) + 50
      });
    }
    return data;
  }, []);

  // Filtrar widgets
  const filteredWidgets = useMemo(() => {
    return widgets.filter(widget => {
      if (!widget.isVisible) return false;
      if (searchTerm && !widget.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedCategory !== 'all') {
        const metric = metrics.find(m => m.key === widget.config.metricKey);
        if (metric && metric.category !== selectedCategory) return false;
      }
      return true;
    });
  }, [widgets, searchTerm, selectedCategory, metrics]);

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Hub Central</h1>
          <p className="text-gray-600">Métricas em tempo real e widgets personalizáveis</p>
        </div>

        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48"
          />
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="users">Usuários</SelectItem>
              <SelectItem value="content">Conteúdo</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
              <SelectItem value="business">Negócio</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>

          {isEditMode && (
            <Button onClick={() => addWidget('metric')}>
              <Plus className="h-4 w-4 mr-2" />
              Widget
            </Button>
          )}
        </div>
      </div>

      {/* Status de conexão */}
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-800">Sistema Online</span>
          <span className="text-xs text-green-600">Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-green-600">
          <span>Widgets ativos: {filteredWidgets.length}</span>
          <span>Métricas: {metrics.length}</span>
          <span>Notificações: {notifications.filter(n => !n.isRead).length}</span>
        </div>
      </div>

      {/* Grid de widgets */}
      <div className={`grid gap-4 ${
        dashboardLayout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
        'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
      }`}>
        {filteredWidgets.map(renderWidget)}
      </div>

      {/* Widget de configuração (modal) */}
      {selectedWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Configurar Widget
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
                  value={widgets.find(w => w.id === selectedWidget)?.size || 'medium'}
                  onValueChange={(value) => updateWidget(selectedWidget, { size: value as Widget['size'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
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

export default EnhancedDashboardHub;