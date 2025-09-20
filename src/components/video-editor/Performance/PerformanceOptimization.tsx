import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  Monitor,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Gauge,
  Thermometer,
  Battery,
  Globe,
  Server,
  Database,
  FileVideo,
  Image,
  Music,
  Play,
  Pause,
  FastForward,
  Rewind,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Filter,
  Layers,
  Grid3X3,
  Target,
  Crosshair,
  Search,
  Download,
  Upload,
  Save,
  Trash2,
  RotateCw,
  Power,
  Sparkles
} from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuUsage: number;
  diskUsage: number;
  networkUsage: number;
  cacheHitRate: number;
  loadingTime: number;
  totalAssets: number;
  processedAssets: number;
  queueSize: number;
}

interface OptimizationSetting {
  id: string;
  name: string;
  description: string;
  category: 'rendering' | 'memory' | 'network' | 'cache' | 'quality';
  currentValue: any;
  recommendedValue: any;
  impact: 'low' | 'medium' | 'high';
  enabled: boolean;
}

interface PerformanceOptimizationProps {
  metrics: PerformanceMetrics;
  onOptimizationChange: (settingId: string, value: any) => void;
  onApplyOptimizations: (settings: OptimizationSetting[]) => void;
  onResetToDefaults: () => void;
}

const PerformanceOptimization: React.FC<PerformanceOptimizationProps> = ({
  metrics,
  onOptimizationChange,
  onApplyOptimizations,
  onResetToDefaults
}) => {
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSetting[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [performanceProfile, setPerformanceProfile] = useState<'balanced' | 'performance' | 'quality'>('balanced');
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);

  // Configurações de otimização disponíveis
  const availableOptimizations: OptimizationSetting[] = [
    // Renderização
    {
      id: 'preview_quality',
      name: 'Qualidade do Preview',
      description: 'Reduz a qualidade do preview para melhor performance',
      category: 'rendering',
      currentValue: 'high',
      recommendedValue: 'medium',
      impact: 'high',
      enabled: false
    },
    {
      id: 'render_threads',
      name: 'Threads de Renderização',
      description: 'Número de threads usadas para renderização',
      category: 'rendering',
      currentValue: 4,
      recommendedValue: 8,
      impact: 'high',
      enabled: false
    },
    {
      id: 'hardware_acceleration',
      name: 'Aceleração por Hardware',
      description: 'Usa GPU para acelerar renderização',
      category: 'rendering',
      currentValue: true,
      recommendedValue: true,
      impact: 'high',
      enabled: true
    },
    {
      id: 'frame_caching',
      name: 'Cache de Frames',
      description: 'Armazena frames renderizados em cache',
      category: 'cache',
      currentValue: false,
      recommendedValue: true,
      impact: 'medium',
      enabled: false
    },

    // Memória
    {
      id: 'memory_limit',
      name: 'Limite de Memória',
      description: 'Limite máximo de memória RAM utilizada',
      category: 'memory',
      currentValue: '8GB',
      recommendedValue: '6GB',
      impact: 'medium',
      enabled: false
    },
    {
      id: 'auto_cleanup',
      name: 'Limpeza Automática',
      description: 'Remove automaticamente assets não utilizados',
      category: 'memory',
      currentValue: false,
      recommendedValue: true,
      impact: 'medium',
      enabled: false
    },
    {
      id: 'lazy_loading',
      name: 'Carregamento Sob Demanda',
      description: 'Carrega assets apenas quando necessário',
      category: 'memory',
      currentValue: false,
      recommendedValue: true,
      impact: 'medium',
      enabled: false
    },

    // Rede
    {
      id: 'cdn_enabled',
      name: 'CDN Ativado',
      description: 'Usa CDN para carregar assets remotos',
      category: 'network',
      currentValue: false,
      recommendedValue: true,
      impact: 'medium',
      enabled: false
    },
    {
      id: 'compression_level',
      name: 'Nível de Compressão',
      description: 'Compressão de dados de rede',
      category: 'network',
      currentValue: 'low',
      recommendedValue: 'high',
      impact: 'low',
      enabled: false
    },

    // Cache
    {
      id: 'cache_size',
      name: 'Tamanho do Cache',
      description: 'Tamanho máximo do cache em disco',
      category: 'cache',
      currentValue: '2GB',
      recommendedValue: '5GB',
      impact: 'medium',
      enabled: false
    },
    {
      id: 'smart_caching',
      name: 'Cache Inteligente',
      description: 'Prioriza cache baseado em uso',
      category: 'cache',
      currentValue: false,
      recommendedValue: true,
      impact: 'medium',
      enabled: false
    },

    // Qualidade
    {
      id: 'audio_quality',
      name: 'Qualidade do Áudio',
      description: 'Qualidade de processamento de áudio',
      category: 'quality',
      currentValue: 'high',
      recommendedValue: 'medium',
      impact: 'low',
      enabled: false
    },
    {
      id: 'effect_precision',
      name: 'Precisão dos Efeitos',
      description: 'Precisão de cálculo dos efeitos visuais',
      category: 'quality',
      currentValue: 'high',
      recommendedValue: 'medium',
      impact: 'medium',
      enabled: false
    }
  ];

  useEffect(() => {
    setOptimizationSettings(availableOptimizations);
    
    // Adicionar métricas ao histórico
    setMetricsHistory(prev => [...prev.slice(-19), metrics]);
  }, [metrics]);

  // Análise automática de performance
  const analyzePerformance = useCallback(() => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const updatedSettings = optimizationSettings.map(setting => {
        let shouldEnable = false;
        
        // Lógica de recomendação baseada nas métricas
        if (metrics.fps < 30 && setting.category === 'rendering') {
          shouldEnable = true;
        }
        if (metrics.memoryUsage > 80 && setting.category === 'memory') {
          shouldEnable = true;
        }
        if (metrics.cpuUsage > 80 && setting.category === 'rendering') {
          shouldEnable = true;
        }
        if (metrics.loadingTime > 5000 && setting.category === 'cache') {
          shouldEnable = true;
        }
        if (metrics.networkUsage > 70 && setting.category === 'network') {
          shouldEnable = true;
        }
        
        return {
          ...setting,
          enabled: shouldEnable
        };
      });
      
      setOptimizationSettings(updatedSettings);
      setIsAnalyzing(false);
    }, 2000);
  }, [metrics, optimizationSettings]);

  // Aplicar perfil de performance
  const applyPerformanceProfile = (profile: 'balanced' | 'performance' | 'quality') => {
    setPerformanceProfile(profile);
    
    const updatedSettings = optimizationSettings.map(setting => {
      let enabled = false;
      
      switch (profile) {
        case 'performance':
          enabled = setting.impact === 'high' || setting.impact === 'medium';
          break;
        case 'quality':
          enabled = setting.impact === 'low';
          break;
        case 'balanced':
          enabled = setting.impact === 'medium';
          break;
      }
      
      return { ...setting, enabled };
    });
    
    setOptimizationSettings(updatedSettings);
  };

  // Calcular score de performance
  const performanceScore = useMemo(() => {
    const fpsScore = Math.min(metrics.fps / 60 * 100, 100);
    const memoryScore = Math.max(100 - metrics.memoryUsage, 0);
    const cpuScore = Math.max(100 - metrics.cpuUsage, 0);
    const loadingScore = Math.max(100 - (metrics.loadingTime / 100), 0);
    
    return Math.round((fpsScore + memoryScore + cpuScore + loadingScore) / 4);
  }, [metrics]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return XCircle;
  };

  const ScoreIcon = getScoreIcon(performanceScore);

  return (
    <div className="h-full space-y-6">
      {/* Header com Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Otimização de Performance
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${getScoreColor(performanceScore)}`}>
                <ScoreIcon className="w-5 h-5" />
                <span className="text-xl font-bold">{performanceScore}</span>
                <span className="text-sm">/ 100</span>
              </div>
              <Button
                onClick={analyzePerformance}
                disabled={isAnalyzing}
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analisando...' : 'Analisar'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.fps}</div>
              <div className="text-sm text-gray-500">FPS</div>
              <Progress value={Math.min(metrics.fps / 60 * 100, 100)} className="mt-1" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.memoryUsage}%</div>
              <div className="text-sm text-gray-500">Memória</div>
              <Progress value={metrics.memoryUsage} className="mt-1" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.cpuUsage}%</div>
              <div className="text-sm text-gray-500">CPU</div>
              <Progress value={metrics.cpuUsage} className="mt-1" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.renderTime}ms</div>
              <div className="text-sm text-gray-500">Render</div>
              <Progress value={Math.min(metrics.renderTime / 100, 100)} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="optimize" className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="optimize">Otimizar</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="optimize" className="space-y-4">
          {/* Controles Rápidos */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                onClick={() => applyPerformanceProfile('performance')}
                variant={performanceProfile === 'performance' ? 'default' : 'outline'}
                size="sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                Máxima Performance
              </Button>
              <Button
                onClick={() => applyPerformanceProfile('balanced')}
                variant={performanceProfile === 'balanced' ? 'default' : 'outline'}
                size="sm"
              >
                <Activity className="w-4 h-4 mr-2" />
                Balanceado
              </Button>
              <Button
                onClick={() => applyPerformanceProfile('quality')}
                variant={performanceProfile === 'quality' ? 'default' : 'outline'}
                size="sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Máxima Qualidade
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => onApplyOptimizations(optimizationSettings.filter(s => s.enabled))}
                size="sm"
              >
                Aplicar Otimizações
              </Button>
              <Button
                onClick={onResetToDefaults}
                variant="outline"
                size="sm"
              >
                Resetar
              </Button>
            </div>
          </div>

          {/* Lista de Otimizações */}
          <div className="space-y-3">
            {['rendering', 'memory', 'cache', 'network', 'quality'].map(category => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base capitalize flex items-center">
                    {category === 'rendering' && <Monitor className="w-4 h-4 mr-2" />}
                    {category === 'memory' && <MemoryStick className="w-4 h-4 mr-2" />}
                    {category === 'cache' && <HardDrive className="w-4 h-4 mr-2" />}
                    {category === 'network' && <Wifi className="w-4 h-4 mr-2" />}
                    {category === 'quality' && <Settings className="w-4 h-4 mr-2" />}
                    {category === 'rendering' ? 'Renderização' :
                     category === 'memory' ? 'Memória' :
                     category === 'cache' ? 'Cache' :
                     category === 'network' ? 'Rede' : 'Qualidade'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {optimizationSettings.filter(s => s.category === category).map(setting => (
                      <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={setting.enabled}
                            onChange={(e) => {
                              const updated = optimizationSettings.map(s =>
                                s.id === setting.id ? { ...s, enabled: e.target.checked } : s
                              );
                              setOptimizationSettings(updated);
                              onOptimizationChange(setting.id, e.target.checked);
                            }}
                            className="w-4 h-4"
                          />
                          <div>
                            <h4 className="font-medium text-sm">{setting.name}</h4>
                            <p className="text-xs text-gray-500">{setting.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              setting.impact === 'high' ? 'default' :
                              setting.impact === 'medium' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {setting.impact === 'high' ? 'Alto Impacto' :
                             setting.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                          </Badge>
                          
                          {setting.currentValue !== setting.recommendedValue && (
                            <Badge variant="outline" className="text-xs">
                              Recomendado
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {/* Métricas Detalhadas */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Uso de Recursos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">CPU</span>
                    <span className="text-sm font-medium">{metrics.cpuUsage}%</span>
                  </div>
                  <Progress value={metrics.cpuUsage} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">GPU</span>
                    <span className="text-sm font-medium">{metrics.gpuUsage}%</span>
                  </div>
                  <Progress value={metrics.gpuUsage} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Memória</span>
                    <span className="text-sm font-medium">{metrics.memoryUsage}%</span>
                  </div>
                  <Progress value={metrics.memoryUsage} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Disco</span>
                    <span className="text-sm font-medium">{metrics.diskUsage}%</span>
                  </div>
                  <Progress value={metrics.diskUsage} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics.fps}</div>
                    <div className="text-sm text-gray-500">FPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics.renderTime}</div>
                    <div className="text-sm text-gray-500">ms render</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics.cacheHitRate}%</div>
                    <div className="text-sm text-gray-500">Cache hit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics.queueSize}</div>
                    <div className="text-sm text-gray-500">Fila</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-1">
                {metricsHistory.map((metric, index) => (
                  <div key={index} className="flex flex-col items-center space-y-1">
                    <div
                      className="bg-blue-500 w-4 rounded-t"
                      style={{ height: `${metric.fps / 60 * 100}%` }}
                    />
                    <div className="text-xs text-gray-500">{index}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className={`cursor-pointer transition-colors ${
              performanceProfile === 'performance' ? 'ring-2 ring-blue-500' : ''
            }`} onClick={() => applyPerformanceProfile('performance')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Prioriza velocidade e responsividade, reduzindo qualidade visual quando necessário.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Velocidade</span>
                    <span className="font-medium">★★★★★</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Qualidade</span>
                    <span className="font-medium">★★★</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Recursos</span>
                    <span className="font-medium">★★</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-colors ${
              performanceProfile === 'balanced' ? 'ring-2 ring-blue-500' : ''
            }`} onClick={() => applyPerformanceProfile('balanced')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Balanceado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Equilibrio entre performance e qualidade visual para uso geral.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Velocidade</span>
                    <span className="font-medium">★★★★</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Qualidade</span>
                    <span className="font-medium">★★★★</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Recursos</span>
                    <span className="font-medium">★★★</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-colors ${
              performanceProfile === 'quality' ? 'ring-2 ring-blue-500' : ''
            }`} onClick={() => applyPerformanceProfile('quality')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Qualidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Máxima qualidade visual e precisão, ideal para exportação final.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Velocidade</span>
                    <span className="font-medium">★★★</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Qualidade</span>
                    <span className="font-medium">★★★★★</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Recursos</span>
                    <span className="font-medium">★★★★★</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Otimização Automática</h4>
                  <p className="text-sm text-gray-500">Ajusta automaticamente com base na performance</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoOptimize}
                  onChange={(e) => setAutoOptimize(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Limite de FPS Target</label>
                <select className="w-full p-2 border rounded">
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS</option>
                  <option value="120">120 FPS</option>
                  <option value="unlimited">Sem Limite</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Qualidade de Renderização</label>
                <select className="w-full p-2 border rounded">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Threads de Processamento</label>
                <input
                  type="range"
                  min="1"
                  max="16"
                  defaultValue="8"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceOptimization;