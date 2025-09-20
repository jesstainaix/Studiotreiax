import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Heart,
  Info,
  MemoryStick,
  Monitor,
  Play,
  RefreshCw,
  Server,
  Settings,
  TrendingUp,
  Users,
  Wifi,
  X,
  Zap,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

// Importar o serviço
import { statusDashboardService, DashboardData } from '../../../services/statusDashboardService';

// Types para o Status Dashboard
export interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
}

export interface ProjectStatus {
  id: string;
  name: string;
  status: 'active' | 'processing' | 'completed' | 'error' | 'paused';
  progress: number;
  lastModified: Date;
  type: 'pptx' | 'video' | 'audio' | 'template';
  errors?: string[];
  estimatedCompletion?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ActionHistoryItem {
  id: string;
  action: string;
  timestamp: Date;
  user: string;
  target: string;
  status: 'success' | 'error' | 'warning';
  details?: string;
  duration?: number;
}

export interface ErrorMetrics {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<'low' | 'medium' | 'high' | 'critical', number>;
  resolved: number;
  pending: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  successRate: number;
  avgProcessingTime: number;
  peakUsage: number;
  trends: {
    labels: string[];
    values: number[];
  };
}

interface StatusDashboardProps {
  isOpen: boolean;
  onToggle: () => void;
  projectId?: string;
  className?: string;
}

export const StatusDashboard: React.FC<StatusDashboardProps> = ({
  isOpen,
  onToggle,
  projectId,
  className = ''
}) => {
  // Estados do dashboard - agora usando o serviço
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMinimized, setIsMinimized] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Inicializar conexão com o serviço
  useEffect(() => {
    if (isOpen) {
      // Subscrever para atualizações
      unsubscribeRef.current = statusDashboardService.subscribe((data) => {
        setDashboardData(data);
      });

      // Configurar auto-refresh
      statusDashboardService.setAutoRefresh(autoRefresh, 5000);

      // Cleanup
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    }
  }, [isOpen, autoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Atualizar dados manualmente
  const refreshData = async () => {
    await statusDashboardService.refreshData();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    const newAutoRefresh = !autoRefresh;
    setAutoRefresh(newAutoRefresh);
    statusDashboardService.setAutoRefresh(newAutoRefresh, 5000);
  };

  // Se não há dados ainda, mostrar loading
  if (!dashboardData) {
    if (!isOpen) {
      return (
        <Button
          onClick={onToggle}
          size="sm"
          variant="outline"
          className="fixed bottom-4 right-4 z-50 bg-gray-900 border-gray-700 hover:bg-gray-800"
        >
          <Activity className="w-4 h-4 mr-2" />
          Status
        </Button>
      );
    }

    return (
      <div className={`fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 z-40 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const { systemHealth, projects, actionHistory, errorMetrics, performanceMetrics } = dashboardData;

  // Formatadores
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'completed':
      case 'success':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning':
      case 'processing':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'critical':
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'active':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'paused':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400 bg-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 bg-gray-900 border-gray-700 hover:bg-gray-800"
      >
        <Activity className="w-4 h-4 mr-2" />
        Status
      </Button>
    );
  }

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 z-40 flex flex-col ${className} ${isMinimized ? 'w-16' : 'w-96'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isMinimized && (
          <>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Status Dashboard</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleAutoRefresh}
                size="sm"
                variant="ghost"
                className={`p-1 ${autoRefresh ? 'text-green-400' : 'text-gray-400'}`}
                title={autoRefresh ? 'Auto-refresh ativo' : 'Auto-refresh inativo'}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                onClick={refreshData}
                size="sm"
                variant="ghost"
                className="p-1"
                title="Atualizar agora"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => setIsMinimized(true)}
                size="sm"
                variant="ghost"
                className="p-1"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={onToggle}
                size="sm"
                variant="ghost"
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
        
        {isMinimized && (
          <div className="flex flex-col items-center space-y-4 w-full">
            <Button
              onClick={() => setIsMinimized(false)}
              size="sm"
              variant="ghost"
              className="p-2"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-3 h-3 rounded-full ${systemHealth.status === 'healthy' ? 'bg-green-400' : systemHealth.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-400 transform -rotate-90 origin-center whitespace-nowrap mt-4">
                {systemHealth.cpu}%
              </span>
            </div>
          </div>
        )}
      </div>

      {!isMinimized && (
        <>
          {/* Quick Stats */}
          <div className="p-4 border-b border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Sistema</span>
                  <Badge className={getStatusColor(systemHealth.status)}>
                    {systemHealth.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  Uptime: {formatUptime(systemHealth.uptime)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Projetos</span>
                  <span className="text-sm font-semibold">
                    {projects.filter(p => p.status === 'processing').length}/
                    {projects.length}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {errorMetrics.pending} erros pendentes
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800 p-1 m-4 mb-0">
                <TabsTrigger value="overview" className="text-xs">
                  <Monitor className="w-3 h-3 mr-1" />
                  Visão
                </TabsTrigger>
                <TabsTrigger value="projects" className="text-xs">
                  <Database className="w-3 h-3 mr-1" />
                  Projetos
                </TabsTrigger>
                <TabsTrigger value="performance" className="text-xs">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Histórico
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* System Health */}
                <Card className="p-4 bg-gray-800 border-gray-700">
                  <h3 className="text-sm font-semibold mb-3 flex items-center">
                    <Heart className="w-4 h-4 mr-2 text-red-400" />
                    Saúde do Sistema
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-3 h-3 text-blue-400" />
                        <span className="text-xs">CPU</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-1 ml-4">
                        <Progress value={systemHealth.cpu} className="flex-1 h-2" />
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {systemHealth.cpu}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MemoryStick className="w-3 h-3 text-green-400" />
                        <span className="text-xs">RAM</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-1 ml-4">
                        <Progress value={systemHealth.memory} className="flex-1 h-2" />
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {systemHealth.memory}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-3 h-3 text-purple-400" />
                        <span className="text-xs">Disco</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-1 ml-4">
                        <Progress value={systemHealth.disk} className="flex-1 h-2" />
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {systemHealth.disk}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs">Rede</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-1 ml-4">
                        <Progress value={systemHealth.network} className="flex-1 h-2" />
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {systemHealth.network}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Error Summary */}
                <Card className="p-4 bg-gray-800 border-gray-700">
                  <h3 className="text-sm font-semibold mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-orange-400" />
                    Resumo de Erros
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {errorMetrics.pending}
                      </div>
                      <div className="text-xs text-gray-400">Pendentes</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {errorMetrics.resolved}
                      </div>
                      <div className="text-xs text-gray-400">Resolvidos</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Taxa de sucesso</span>
                      <span className="text-green-400 font-semibold">
                        {performanceMetrics.successRate}%
                      </span>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects" className="flex-1 overflow-y-auto p-4 space-y-3">
                {projects.map(project => (
                  <Card key={project.id} className="p-3 bg-gray-800 border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold truncate">
                          {project.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 text-right">
                        {new Date(project.lastModified).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {project.status === 'processing' && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Progresso</span>
                          <span className="text-gray-400">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                        {project.estimatedCompletion && (
                          <div className="text-xs text-gray-500 mt-1">
                            ETA: {project.estimatedCompletion.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {project.errors && project.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                        {project.errors.map((error, index) => (
                          <div key={index} className="text-xs text-red-400">
                            • {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="flex-1 overflow-y-auto p-4 space-y-4">
                <Card className="p-4 bg-gray-800 border-gray-700">
                  <h3 className="text-sm font-semibold mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-400" />
                    Métricas de Performance
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">
                        {performanceMetrics.responseTime}ms
                      </div>
                      <div className="text-xs text-gray-400">Tempo de Resposta</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        {performanceMetrics.throughput}
                      </div>
                      <div className="text-xs text-gray-400">Throughput/min</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-400">
                        {performanceMetrics.errorRate}%
                      </div>
                      <div className="text-xs text-gray-400">Taxa de Erro</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-400">
                        {formatDuration(performanceMetrics.avgProcessingTime)}
                      </div>
                      <div className="text-xs text-gray-400">Proc. Médio</div>
                    </div>
                  </div>
                </Card>

                {/* Error Breakdown */}
                <Card className="p-4 bg-gray-800 border-gray-700">
                  <h3 className="text-sm font-semibold mb-3">Tipos de Erro</h3>
                  
                  <div className="space-y-2">
                    {Object.entries(errorMetrics.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 capitalize">
                          {type}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-red-400 h-2 rounded-full"
                              style={{ width: `${(count / errorMetrics.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-300 w-6 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="flex-1 overflow-y-auto p-4 space-y-3">
                {actionHistory.map(action => (
                  <Card key={action.id} className="p-3 bg-gray-800 border-gray-700">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                        action.status === 'success' ? 'bg-green-400' :
                        action.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold truncate">
                            {action.action}
                          </h4>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {action.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-400 mt-1">
                          {action.user} → {action.target}
                        </div>
                        
                        {action.duration && (
                          <div className="text-xs text-gray-500 mt-1">
                            Duração: {formatDuration(action.duration)}
                          </div>
                        )}
                        
                        {action.details && (
                          <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-700/50 rounded">
                            {action.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
};

export default StatusDashboard;