// Interface para Sistema de Otimização
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import {
  Zap,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Battery,
  Thermometer,
  Activity,
  TrendingUp,
  TrendingDown,
  Settings,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Gauge,
  Target,
  Layers,
  Monitor,
  Smartphone
} from 'lucide-react';

// Interfaces
interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
    cores: number;
    frequency: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
    usage: number;
  };
  gpu: {
    usage: number;
    memory: number;
    temperature: number;
    vram: number;
  };
  disk: {
    used: number;
    total: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    download: number;
    upload: number;
    latency: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  battery?: {
    level: number;
    charging: boolean;
    timeRemaining: number;
  };
}

interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'memory' | 'storage' | 'network' | 'power';
  enabled: boolean;
  impact: 'low' | 'medium' | 'high';
  risk: 'safe' | 'moderate' | 'risky';
  action: () => Promise<void>;
}

interface OptimizationProfile {
  id: string;
  name: string;
  description: string;
  rules: string[];
  settings: {
    cpuPriority: 'low' | 'normal' | 'high';
    memoryLimit: number;
    diskCache: boolean;
    networkOptimization: boolean;
    powerSaving: boolean;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  suggestion?: string;
}

interface SystemOptimizerInterfaceProps {
  onClose?: () => void;
}

const SystemOptimizerInterface: React.FC<SystemOptimizerInterfaceProps> = ({ onClose }) => {
  // Estados principais
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 45, temperature: 65, cores: 8, frequency: 3.2 },
    memory: { used: 8.5, total: 16, available: 7.5, usage: 53 },
    gpu: { usage: 30, memory: 4, temperature: 70, vram: 8 },
    disk: { used: 250, total: 500, readSpeed: 150, writeSpeed: 120 },
    network: { download: 50, upload: 10, latency: 25, quality: 'good' },
    battery: { level: 75, charging: false, timeRemaining: 180 }
  });
  
  const [optimizationRules, setOptimizationRules] = useState<OptimizationRule[]>([]);
  const [profiles, setProfiles] = useState<OptimizationProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<OptimizationProfile | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);

  // Inicialização
  useEffect(() => {
    initializeOptimizationRules();
    initializeProfiles();
    if (monitoringEnabled) {
      startMetricsMonitoring();
    }
  }, [monitoringEnabled]);

  const initializeOptimizationRules = () => {
    const rules: OptimizationRule[] = [
      {
        id: 'memory-cleanup',
        name: 'Limpeza de Memória',
        description: 'Remove processos desnecessários e libera memória RAM',
        category: 'memory',
        enabled: true,
        impact: 'medium',
        risk: 'safe',
        action: async () => {
          // Simular limpeza de memória
          await new Promise(resolve => setTimeout(resolve, 2000));
          setMetrics(prev => ({
            ...prev,
            memory: {
              ...prev.memory,
              used: prev.memory.used * 0.8,
              usage: prev.memory.usage * 0.8
            }
          }));
        }
      },
      {
        id: 'cpu-optimization',
        name: 'Otimização de CPU',
        description: 'Ajusta prioridades de processos para melhor performance',
        category: 'performance',
        enabled: true,
        impact: 'high',
        risk: 'moderate',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 3000));
          setMetrics(prev => ({
            ...prev,
            cpu: {
              ...prev.cpu,
              usage: Math.max(prev.cpu.usage - 15, 10)
            }
          }));
        }
      },
      {
        id: 'disk-cleanup',
        name: 'Limpeza de Disco',
        description: 'Remove arquivos temporários e cache desnecessário',
        category: 'storage',
        enabled: true,
        impact: 'medium',
        risk: 'safe',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 4000));
          setMetrics(prev => ({
            ...prev,
            disk: {
              ...prev.disk,
              used: Math.max(prev.disk.used - 10, 100)
            }
          }));
        }
      },
      {
        id: 'network-optimization',
        name: 'Otimização de Rede',
        description: 'Otimiza configurações de rede para melhor velocidade',
        category: 'network',
        enabled: false,
        impact: 'medium',
        risk: 'moderate',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 2500));
          setMetrics(prev => ({
            ...prev,
            network: {
              ...prev.network,
              latency: Math.max(prev.network.latency - 5, 5),
              download: prev.network.download * 1.2
            }
          }));
        }
      },
      {
        id: 'power-saving',
        name: 'Economia de Energia',
        description: 'Ativa modo de economia de energia para laptops',
        category: 'power',
        enabled: false,
        impact: 'low',
        risk: 'safe',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (metrics.battery) {
            setMetrics(prev => ({
              ...prev,
              battery: prev.battery ? {
                ...prev.battery,
                timeRemaining: prev.battery.timeRemaining * 1.3
              } : undefined
            }));
          }
        }
      }
    ];

    setOptimizationRules(rules);
  };

  const initializeProfiles = () => {
    const defaultProfiles: OptimizationProfile[] = [
      {
        id: 'gaming',
        name: 'Gaming Performance',
        description: 'Máxima performance para jogos e aplicações 3D',
        rules: ['memory-cleanup', 'cpu-optimization'],
        settings: {
          cpuPriority: 'high',
          memoryLimit: 90,
          diskCache: true,
          networkOptimization: true,
          powerSaving: false
        }
      },
      {
        id: 'productivity',
        name: 'Produtividade',
        description: 'Balanceamento entre performance e eficiência',
        rules: ['memory-cleanup', 'disk-cleanup'],
        settings: {
          cpuPriority: 'normal',
          memoryLimit: 75,
          diskCache: true,
          networkOptimization: false,
          powerSaving: false
        }
      },
      {
        id: 'battery-saver',
        name: 'Economia de Bateria',
        description: 'Máxima duração da bateria para laptops',
        rules: ['power-saving', 'memory-cleanup'],
        settings: {
          cpuPriority: 'low',
          memoryLimit: 60,
          diskCache: false,
          networkOptimization: false,
          powerSaving: true
        }
      }
    ];

    setProfiles(defaultProfiles);
    setActiveProfile(defaultProfiles[1]); // Produtividade como padrão
  };

  const startMetricsMonitoring = () => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const newMetrics = {
          cpu: {
            ...prev.cpu,
            usage: Math.max(0, Math.min(100, prev.cpu.usage + (Math.random() - 0.5) * 10)),
            temperature: Math.max(30, Math.min(90, prev.cpu.temperature + (Math.random() - 0.5) * 5))
          },
          memory: {
            ...prev.memory,
            usage: Math.max(0, Math.min(100, prev.memory.usage + (Math.random() - 0.5) * 5))
          },
          gpu: {
            ...prev.gpu,
            usage: Math.max(0, Math.min(100, prev.gpu.usage + (Math.random() - 0.5) * 15)),
            temperature: Math.max(30, Math.min(95, prev.gpu.temperature + (Math.random() - 0.5) * 8))
          },
          disk: {
            ...prev.disk,
            readSpeed: Math.max(0, prev.disk.readSpeed + (Math.random() - 0.5) * 20),
            writeSpeed: Math.max(0, prev.disk.writeSpeed + (Math.random() - 0.5) * 15)
          },
          network: {
            ...prev.network,
            latency: Math.max(1, prev.network.latency + (Math.random() - 0.5) * 5)
          },
          battery: prev.battery ? {
            ...prev.battery,
            level: Math.max(0, Math.min(100, prev.battery.level + (Math.random() - 0.5) * 2))
          } : undefined
        };

        // Verificar alertas
        checkPerformanceAlerts(newMetrics);

        return newMetrics;
      });
    }, 3000);

    return () => clearInterval(interval);
  };

  const checkPerformanceAlerts = (currentMetrics: SystemMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    if (currentMetrics.cpu.usage > 80) {
      newAlerts.push({
        id: `cpu-high-${Date.now()}`,
        type: 'warning',
        title: 'Alto uso de CPU',
        message: `CPU está em ${currentMetrics.cpu.usage.toFixed(1)}% de uso`,
        timestamp: new Date(),
        resolved: false,
        suggestion: 'Execute a otimização de CPU ou feche aplicações desnecessárias'
      });
    }

    if (currentMetrics.memory.usage > 85) {
      newAlerts.push({
        id: `memory-high-${Date.now()}`,
        type: 'error',
        title: 'Memória insuficiente',
        message: `Memória RAM está em ${currentMetrics.memory.usage.toFixed(1)}% de uso`,
        timestamp: new Date(),
        resolved: false,
        suggestion: 'Execute a limpeza de memória imediatamente'
      });
    }

    if (currentMetrics.cpu.temperature > 80) {
      newAlerts.push({
        id: `temp-high-${Date.now()}`,
        type: 'warning',
        title: 'Temperatura alta',
        message: `CPU está a ${currentMetrics.cpu.temperature}°C`,
        timestamp: new Date(),
        resolved: false,
        suggestion: 'Verifique a ventilação do sistema'
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    }
  };

  const runOptimization = async (rules?: OptimizationRule[]) => {
    setIsOptimizing(true);
    const rulesToRun = rules || optimizationRules.filter(rule => rule.enabled);

    for (const rule of rulesToRun) {
      try {
        await rule.action();
        // Adicionar alerta de sucesso
        setAlerts(prev => [{
          id: `success-${rule.id}-${Date.now()}`,
          type: 'info',
          title: 'Otimização concluída',
          message: `${rule.name} executada com sucesso`,
          timestamp: new Date(),
          resolved: false
        }, ...prev].slice(0, 10));
      } catch (error) {
        setAlerts(prev => [{
          id: `error-${rule.id}-${Date.now()}`,
          type: 'error',
          title: 'Erro na otimização',
          message: `Falha ao executar ${rule.name}`,
          timestamp: new Date(),
          resolved: false
        }, ...prev].slice(0, 10));
      }
    }

    setIsOptimizing(false);
  };

  const applyProfile = async (profile: OptimizationProfile) => {
    setActiveProfile(profile);
    const profileRules = optimizationRules.filter(rule => 
      profile.rules.includes(rule.id)
    );
    await runOptimization(profileRules);
  };

  const getMetricColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getMetricBgColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Otimizador de Sistema</h1>
              <p className="text-sm text-gray-500">Monitoramento e otimização em tempo real</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Label className="text-sm">Auto-otimizar</Label>
              <Switch
                checked={autoOptimize}
                onCheckedChange={setAutoOptimize}
              />
            </div>
            <Button
              onClick={() => runOptimization()}
              disabled={isOptimizing}
              className="flex items-center space-x-2"
            >
              {isOptimizing ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Otimizando...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Otimizar</span>
                </>
              )}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="optimization">Otimização</TabsTrigger>
            <TabsTrigger value="profiles">Perfis</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* CPU Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">CPU</CardTitle>
                    <Cpu className="w-4 h-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    <span className={getMetricColor(metrics.cpu.usage, { warning: 70, danger: 85 })}>
                      {metrics.cpu.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={metrics.cpu.usage} 
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-gray-500">
                    {metrics.cpu.temperature}°C • {metrics.cpu.cores} cores
                  </div>
                </CardContent>
              </Card>

              {/* Memory Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Memória</CardTitle>
                    <MemoryStick className="w-4 h-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    <span className={getMetricColor(metrics.memory.usage, { warning: 75, danger: 90 })}>
                      {metrics.memory.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={metrics.memory.usage} 
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-gray-500">
                    {metrics.memory.used.toFixed(1)}GB / {metrics.memory.total}GB
                  </div>
                </CardContent>
              </Card>

              {/* GPU Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">GPU</CardTitle>
                    <Monitor className="w-4 h-4 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    <span className={getMetricColor(metrics.gpu.usage, { warning: 80, danger: 95 })}>
                      {metrics.gpu.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={metrics.gpu.usage} 
                    className="h-2 mb-2"
                  />
                  <div className="text-xs text-gray-500">
                    {metrics.gpu.temperature}°C • {metrics.gpu.vram}GB VRAM
                  </div>
                </CardContent>
              </Card>

              {/* Network Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Rede</CardTitle>
                    <Wifi className="w-4 h-4 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    <span className="text-blue-600">{metrics.network.latency}ms</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>↓ {metrics.network.download} Mbps</div>
                    <div>↑ {metrics.network.upload} Mbps</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {optimizationRules.slice(0, 4).map(rule => (
                    <Button
                      key={rule.id}
                      variant="outline"
                      className="h-auto p-3 flex flex-col items-center space-y-2"
                      onClick={() => runOptimization([rule])}
                      disabled={isOptimizing}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {rule.category === 'memory' && <MemoryStick className="w-4 h-4 text-blue-600" />}
                        {rule.category === 'performance' && <Cpu className="w-4 h-4 text-blue-600" />}
                        {rule.category === 'storage' && <HardDrive className="w-4 h-4 text-blue-600" />}
                        {rule.category === 'network' && <Wifi className="w-4 h-4 text-blue-600" />}
                      </div>
                      <span className="text-xs text-center">{rule.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Detailed CPU Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5" />
                    <span>CPU Detalhado</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uso</span>
                      <span>{metrics.cpu.usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.cpu.usage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Temperatura</span>
                      <span>{metrics.cpu.temperature}°C</span>
                    </div>
                    <Progress value={(metrics.cpu.temperature / 100) * 100} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Cores:</span>
                      <span className="ml-2 font-medium">{metrics.cpu.cores}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Frequência:</span>
                      <span className="ml-2 font-medium">{metrics.cpu.frequency} GHz</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Memory Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MemoryStick className="w-5 h-5" />
                    <span>Memória Detalhada</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uso</span>
                      <span>{metrics.memory.usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.memory.usage} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Usado:</span>
                      <span className="ml-2 font-medium">{metrics.memory.used.toFixed(1)} GB</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <span className="ml-2 font-medium">{metrics.memory.total} GB</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Disponível:</span>
                      <span className="ml-2 font-medium">{metrics.memory.available.toFixed(1)} GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disk Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5" />
                    <span>Armazenamento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uso do Disco</span>
                      <span>{((metrics.disk.used / metrics.disk.total) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(metrics.disk.used / metrics.disk.total) * 100} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Leitura:</span>
                      <span className="ml-2 font-medium">{metrics.disk.readSpeed.toFixed(0)} MB/s</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Escrita:</span>
                      <span className="ml-2 font-medium">{metrics.disk.writeSpeed.toFixed(0)} MB/s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wifi className="w-5 h-5" />
                    <span>Rede</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Download:</span>
                      <span className="ml-2 font-medium">{metrics.network.download} Mbps</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Upload:</span>
                      <span className="ml-2 font-medium">{metrics.network.upload} Mbps</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Latência:</span>
                      <span className="ml-2 font-medium">{metrics.network.latency} ms</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Qualidade:</span>
                      <Badge variant={metrics.network.quality === 'excellent' ? 'default' : 'secondary'}>
                        {metrics.network.quality}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regras de Otimização</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {optimizationRules.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => 
                              setOptimizationRules(prev => 
                                prev.map(r => 
                                  r.id === rule.id ? { ...r, enabled: checked } : r
                                )
                              )
                            }
                          />
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-gray-500">{rule.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={rule.impact === 'high' ? 'default' : 'secondary'}>
                            {rule.impact}
                          </Badge>
                          <Badge variant={rule.risk === 'safe' ? 'default' : 'destructive'}>
                            {rule.risk}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => runOptimization([rule])}
                            disabled={isOptimizing}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profiles" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profiles.map(profile => (
                <Card 
                  key={profile.id}
                  className={`cursor-pointer transition-all ${
                    activeProfile?.id === profile.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => applyProfile(profile)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{profile.name}</span>
                      {activeProfile?.id === profile.id && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{profile.description}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>CPU Priority:</span>
                        <Badge variant="outline">{profile.settings.cpuPriority}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory Limit:</span>
                        <span>{profile.settings.memoryLimit}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rules:</span>
                        <span>{profile.rules.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>Nenhum alerta ativo</p>
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="mt-1">
                          {alert.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                          {alert.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-gray-600">{alert.message}</div>
                          {alert.suggestion && (
                            <div className="text-xs text-blue-600 mt-1">{alert.suggestion}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {alert.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => 
                            setAlerts(prev => 
                              prev.map(a => 
                                a.id === alert.id ? { ...a, resolved: true } : a
                              ).filter(a => !a.resolved)
                            )
                          }
                        >
                          Resolver
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SystemOptimizerInterface;