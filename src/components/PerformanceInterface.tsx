// Interface para Sistema de Análise de Performance
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  Gauge,
  BarChart3,
  LineChart,
  PieChart,
  Thermometer,
  Wifi,
  Clock,
  Target,
  Lightbulb,
  Wrench
} from 'lucide-react';
import PerformanceAnalyzer, {
  PerformanceMetric,
  SystemHealth,
  PerformanceProfile,
  OptimizationSuggestion,
  BenchmarkResult,
  PerformanceAlert,
  PerformanceReport
} from '../systems/PerformanceAnalyzer';

// Interfaces
interface PerformanceInterfaceProps {
  onClose?: () => void;
}

interface ChartData {
  timestamp: string;
  cpu: number;
  memory: number;
  gpu?: number;
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold?: { warning: number; critical: number };
}

interface AlertItemProps {
  alert: PerformanceAlert;
  onAcknowledge: (id: string) => void;
}

interface BenchmarkItemProps {
  benchmark: BenchmarkResult;
  onRerun?: () => void;
}

interface OptimizationItemProps {
  suggestion: OptimizationSuggestion;
  onApply: (id: string) => void;
  isApplying: boolean;
}

// Componentes auxiliares
const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, icon, severity, threshold }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };
  
  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };
  
  return (
    <Card className={`${getSeverityBg(severity)} transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={getSeverityColor(severity)}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className={`text-2xl font-bold ${getSeverityColor(severity)}`}>
                {value.toFixed(1)}{unit}
              </p>
            </div>
          </div>
          {threshold && (
            <div className="text-right">
              <div className="text-xs text-gray-500">
                Warning: {threshold.warning}{unit}
              </div>
              <div className="text-xs text-gray-500">
                Critical: {threshold.critical}{unit}
              </div>
            </div>
          )}
        </div>
        <Progress 
          value={value} 
          className="mt-2" 
          max={100}
        />
      </CardContent>
    </Card>
  );
};

const AlertItem: React.FC<AlertItemProps> = ({ alert, onAcknowledge }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default: return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getAlertBg = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };
  
  return (
    <Card className={`${getAlertBg(alert.type)} ${alert.acknowledged ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getAlertIcon(alert.type)}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{alert.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              <div className="text-xs text-gray-500 mt-2">
                {alert.timestamp.toLocaleString()}
              </div>
              {alert.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">Sugestões:</p>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    {alert.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Lightbulb className="h-3 w-3" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {!alert.acknowledged && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(alert.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const BenchmarkItem: React.FC<BenchmarkItemProps> = ({ benchmark, onRerun }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{benchmark.name}</h4>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className={`font-bold ${getScoreColor(benchmark.score)}`}>
                  {benchmark.score.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {benchmark.duration.toFixed(0)}ms
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {benchmark.details.frameRate.toFixed(1)} FPS
                </span>
              </div>
            </div>
            {benchmark.comparison && (
              <div className="flex items-center space-x-2 mt-2">
                {benchmark.comparison.improvement > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  benchmark.comparison.improvement > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {benchmark.comparison.improvement > 0 ? '+' : ''}
                  {benchmark.comparison.improvement.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          {onRerun && (
            <Button size="sm" variant="outline" onClick={onRerun}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Executar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const OptimizationItem: React.FC<OptimizationItemProps> = ({ suggestion, onApply, isApplying }) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
              <Badge className={getImpactColor(suggestion.impact)}>
                {suggestion.impact}
              </Badge>
              <Badge className={getDifficultyColor(suggestion.difficulty)}>
                {suggestion.difficulty}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  +{suggestion.estimatedImprovement}%
                </span>
              </div>
              <Badge variant="outline">{suggestion.category}</Badge>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onApply(suggestion.id)}
            disabled={isApplying}
          >
            {isApplying ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Aplicando...</span>
              </div>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-1" />
                Aplicar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal
const PerformanceInterface: React.FC<PerformanceInterfaceProps> = ({ onClose }) => {
  // Estados
  const [analyzer] = useState(() => new PerformanceAnalyzer());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentHealth, setCurrentHealth] = useState<SystemHealth | null>(null);
  const [profiles, setProfiles] = useState<PerformanceProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<PerformanceProfile | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [applyingOptimizations, setApplyingOptimizations] = useState<Set<string>>(new Set());
  const [runningBenchmark, setRunningBenchmark] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Refs
  const chartRef = useRef<HTMLCanvasElement>(null);
  
  // Inicialização
  useEffect(() => {
    const initializeAnalyzer = async () => {
      try {
        await analyzer.initialize();
        
        setProfiles(analyzer.getProfiles());
        setActiveProfile(analyzer.getActiveProfile());
        setIsInitialized(true);
        
        // Event listeners
        analyzer.on('metricsUpdated', handleMetricsUpdate);
        analyzer.on('alert', handleNewAlert);
        analyzer.on('profileChanged', handleProfileChange);
        analyzer.on('benchmarkCompleted', handleBenchmarkComplete);
        analyzer.on('optimizationApplied', handleOptimizationApplied);
      } catch (error) {
        console.error('Erro ao inicializar Performance Analyzer:', error);
      }
    };
    
    initializeAnalyzer();
    
    return () => {
      analyzer.destroy();
    };
  }, []);
  
  // Atualizar sugestões quando health muda
  useEffect(() => {
    if (currentHealth) {
      setSuggestions(analyzer.getOptimizationSuggestions());
    }
  }, [currentHealth]);
  
  // Event handlers
  const handleMetricsUpdate = (health: SystemHealth) => {
    setCurrentHealth(health);
    setMetrics(analyzer.getMetrics());
    
    // Atualizar dados do gráfico
    const newDataPoint: ChartData = {
      timestamp: new Date().toLocaleTimeString(),
      cpu: health.cpu.usage,
      memory: health.memory.percentage,
      gpu: health.gpu?.usage
    };
    
    setChartData(prev => {
      const updated = [...prev, newDataPoint];
      // Manter apenas os últimos 60 pontos (1 hora com intervalo de 1 minuto)
      return updated.slice(-60);
    });
  };
  
  const handleNewAlert = (alert: PerformanceAlert) => {
    setAlerts(prev => [alert, ...prev]);
  };
  
  const handleProfileChange = (profile: PerformanceProfile) => {
    setActiveProfile(profile);
  };
  
  const handleBenchmarkComplete = (result: BenchmarkResult) => {
    setBenchmarks(prev => [result, ...prev]);
    setRunningBenchmark(null);
  };
  
  const handleOptimizationApplied = (suggestion: OptimizationSuggestion) => {
    setApplyingOptimizations(prev => {
      const updated = new Set(prev);
      updated.delete(suggestion.id);
      return updated;
    });
    
    // Atualizar sugestões
    setSuggestions(analyzer.getOptimizationSuggestions());
  };
  
  // Ações
  const toggleMonitoring = () => {
    if (isMonitoring) {
      analyzer.stopMonitoring();
    } else {
      analyzer.startMonitoring();
    }
    setIsMonitoring(!isMonitoring);
  };
  
  const changeProfile = (profileId: string) => {
    analyzer.setActiveProfile(profileId);
  };
  
  const acknowledgeAlert = (alertId: string) => {
    analyzer.acknowledgeAlert(alertId);
    setAlerts(analyzer.getAlerts());
  };
  
  const clearAllAlerts = () => {
    analyzer.clearAlerts();
    setAlerts([]);
  };
  
  const runBenchmark = async (name: string) => {
    setRunningBenchmark(name);
    
    try {
      await analyzer.runBenchmark(name, async () => {
        // Simular benchmark
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      });
    } catch (error) {
      console.error('Erro ao executar benchmark:', error);
      setRunningBenchmark(null);
    }
  };
  
  const applyOptimization = async (suggestionId: string) => {
    setApplyingOptimizations(prev => new Set(prev).add(suggestionId));
    
    try {
      await analyzer.applyOptimization(suggestionId);
    } catch (error) {
      console.error('Erro ao aplicar otimização:', error);
      setApplyingOptimizations(prev => {
        const updated = new Set(prev);
        updated.delete(suggestionId);
        return updated;
      });
    }
  };
  
  const generateReport = () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 horas
    
    const report = analyzer.generateReport({ start: startDate, end: endDate });
    
    // Simular download do relatório
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando sistema de análise de performance...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise de Performance</h1>
          <p className="text-gray-600 mt-1">Monitoramento e otimização em tempo real</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={toggleMonitoring}
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </>
            )}
          </Button>
          <Button variant="outline" onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </div>
      
      {/* Status Cards */}
      {currentHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="CPU"
            value={currentHealth.cpu.usage}
            unit="%"
            icon={<Cpu className="h-5 w-5" />}
            severity={analyzer.getMetrics('cpu').slice(-1)[0]?.severity || 'low'}
            threshold={{ warning: 70, critical: 90 }}
          />
          <MetricCard
            title="Memória"
            value={currentHealth.memory.percentage}
            unit="%"
            icon={<MemoryStick className="h-5 w-5" />}
            severity={analyzer.getMetrics('memory').slice(-1)[0]?.severity || 'low'}
            threshold={{ warning: 80, critical: 95 }}
          />
          {currentHealth.gpu && (
            <MetricCard
              title="GPU"
              value={currentHealth.gpu.usage}
              unit="%"
              icon={<Monitor className="h-5 w-5" />}
              severity={analyzer.getMetrics('gpu').slice(-1)[0]?.severity || 'low'}
              threshold={{ warning: 80, critical: 95 }}
            />
          )}
          <MetricCard
            title="Performance Geral"
            value={currentHealth.overall}
            unit="%"
            icon={<Gauge className="h-5 w-5" />}
            severity={currentHealth.overall >= 80 ? 'low' : currentHealth.overall >= 60 ? 'medium' : 'high'}
          />
        </div>
      )}
      
      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas ({alerts.filter(a => !a.acknowledged).length})</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="optimization">Otimização</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Perfil de Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={activeProfile?.id || ''} onValueChange={changeProfile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div>
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-sm text-gray-500">{profile.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {activeProfile && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Qualidade:</span>
                        <span className="ml-2">{activeProfile.settings.renderQuality}</span>
                      </div>
                      <div>
                        <span className="font-medium">Partículas:</span>
                        <span className="ml-2">{activeProfile.settings.particleCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Shaders:</span>
                        <span className="ml-2">{activeProfile.settings.shaderComplexity}</span>
                      </div>
                      <div>
                        <span className="font-medium">Texturas:</span>
                        <span className="ml-2">{activeProfile.settings.textureResolution}px</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Anti-aliasing</span>
                        <Switch checked={activeProfile.settings.antiAliasing} disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pós-processamento</span>
                        <Switch checked={activeProfile.settings.postProcessing} disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Multi-threading</span>
                        <Switch checked={activeProfile.settings.multiThreading} disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Aceleração GPU</span>
                        <Switch checked={activeProfile.settings.gpuAcceleration} disabled />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* System Info */}
            {currentHealth && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Informações do Sistema</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">CPU</div>
                      <div>{currentHealth.cpu.cores} cores @ {currentHealth.cpu.frequency}MHz</div>
                      {currentHealth.cpu.temperature && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Thermometer className="h-3 w-3" />
                          <span>{currentHealth.cpu.temperature.toFixed(1)}°C</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700">Memória</div>
                      <div>{(currentHealth.memory.total / (1024**3)).toFixed(1)} GB total</div>
                      <div>{(currentHealth.memory.used / (1024**3)).toFixed(1)} GB usado</div>
                    </div>
                    
                    {currentHealth.gpu && (
                      <div>
                        <div className="font-medium text-gray-700">GPU</div>
                        <div>{(currentHealth.gpu.memory.total / (1024**3)).toFixed(1)} GB VRAM</div>
                        {currentHealth.gpu.temperature && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Thermometer className="h-3 w-3" />
                            <span>{currentHealth.gpu.temperature.toFixed(1)}°C</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <div className="font-medium text-gray-700">Rede</div>
                      <div className="flex items-center space-x-1">
                        <Wifi className="h-3 w-3" />
                        <span>{currentHealth.network.latency.toFixed(0)}ms</span>
                      </div>
                      <div>↓ {currentHealth.network.bandwidth.download.toFixed(0)} Mbps</div>
                      <div>↑ {currentHealth.network.bandwidth.upload.toFixed(0)} Mbps</div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700">Armazenamento</div>
                      <div>{(currentHealth.storage.total / (1024**3)).toFixed(0)} GB total</div>
                      <div>R: {currentHealth.storage.readSpeed.toFixed(0)} MB/s</div>
                      <div>W: {currentHealth.storage.writeSpeed.toFixed(0)} MB/s</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5" />
                  <span>Histórico de Performance</span>
                </div>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5m">5 minutos</SelectItem>
                    <SelectItem value="15m">15 minutos</SelectItem>
                    <SelectItem value="1h">1 hora</SelectItem>
                    <SelectItem value="6h">6 horas</SelectItem>
                    <SelectItem value="24h">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p>Gráfico de performance em tempo real</p>
                  <p className="text-sm">({chartData.length} pontos de dados)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {['cpu', 'memory', 'gpu'].map(category => {
              const categoryMetrics = analyzer.getMetrics(category).slice(0, 10);
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{category} Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryMetrics.map(metric => (
                        <div key={metric.id} className="flex items-center justify-between text-sm">
                          <span>{metric.timestamp.toLocaleTimeString()}</span>
                          <span className={`font-medium ${
                            metric.severity === 'critical' ? 'text-red-500' :
                            metric.severity === 'high' ? 'text-orange-500' :
                            metric.severity === 'medium' ? 'text-yellow-500' :
                            'text-green-500'
                          }`}>
                            {metric.value.toFixed(1)}{metric.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Alertas do Sistema</h3>
            <Button variant="outline" onClick={clearAllAlerts}>
              Limpar Todos
            </Button>
          </div>
          
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum Alerta</h3>
                  <p className="text-gray-600">Sistema funcionando normalmente</p>
                </CardContent>
              </Card>
            ) : (
              alerts.map(alert => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={acknowledgeAlert}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Benchmarks de Performance</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => runBenchmark('Render Test')}
                disabled={runningBenchmark === 'Render Test'}
              >
                {runningBenchmark === 'Render Test' ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Executando...</span>
                  </div>
                ) : (
                  'Teste de Renderização'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => runBenchmark('Memory Test')}
                disabled={runningBenchmark === 'Memory Test'}
              >
                {runningBenchmark === 'Memory Test' ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Executando...</span>
                  </div>
                ) : (
                  'Teste de Memória'
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {benchmarks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum Benchmark</h3>
                  <p className="text-gray-600">Execute um benchmark para ver os resultados</p>
                </CardContent>
              </Card>
            ) : (
              benchmarks.map(benchmark => (
                <BenchmarkItem
                  key={benchmark.id}
                  benchmark={benchmark}
                  onRerun={() => runBenchmark(benchmark.name)}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Sugestões de Otimização</h3>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoOptimize}
                  onCheckedChange={setAutoOptimize}
                />
                <span className="text-sm">Auto-otimização</span>
              </div>
              <Button variant="outline" onClick={() => setSuggestions(analyzer.getOptimizationSuggestions())}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Zap className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema Otimizado</h3>
                  <p className="text-gray-600">Nenhuma otimização necessária no momento</p>
                </CardContent>
              </Card>
            ) : (
              suggestions.map(suggestion => (
                <OptimizationItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={applyOptimization}
                  isApplying={applyingOptimizations.has(suggestion.id)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceInterface;