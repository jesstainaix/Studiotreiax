import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  TestTube2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  FileText,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Target,
  Activity,
  Zap,
  Eye,
  EyeOff,
  Search,
  Filter,
  Save,
  Trash2,
  Copy,
  Edit,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  SkipBack,
  Maximize,
  Minimize,
  Grid,
  List,
  Calendar,
  MapPin,
  Flag,
  Award,
  Star,
  ThumbsUp,
  Heart,
  Bookmark,
  Share2,
  Info,
  HelpCircle,
  X,
  Archive,
  Database,
  Server,
  Cloud,
  Cpu,
  MemoryStick,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  Bluetooth,
  Camera,
  Video,
  Music,
  Image,
  FileCode,
  Code,
  Terminal,
  Bug,
  Shield,
  Lock,
  Unlock,
  Key,
  Layers,
  Package,
  Wrench,
  Gauge,
  Timer,
  Stopwatch
} from 'lucide-react';

// Tipos para testes
interface TestSuite {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'accessibility' | 'security';
  tests: TestCase[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: number;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  assertions: number;
  coverage?: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface TestConfiguration {
  timeout: number;
  retries: number;
  parallel: boolean;
  coverage: boolean;
  reporters: string[];
  environment: 'development' | 'staging' | 'production';
  mockLevel: 'none' | 'basic' | 'full';
}

interface PerformanceTest {
  id: string;
  name: string;
  type: 'load' | 'stress' | 'spike' | 'volume' | 'endurance';
  status: 'idle' | 'running' | 'completed' | 'failed';
  duration: number;
  metrics: {
    averageResponseTime: number;
    peakResponseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  thresholds: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
  };
}

interface TestReport {
  id: string;
  timestamp: Date;
  environment: string;
  totalSuites: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
  duration: number;
  suites: TestSuite[];
}

interface ComprehensiveTestSystemProps {
  onTestComplete: (report: TestReport) => void;
  onConfigChange: (config: TestConfiguration) => void;
  className?: string;
}

const ComprehensiveTestSystem: React.FC<ComprehensiveTestSystemProps> = ({
  onTestComplete,
  onConfigChange,
  className = ''
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'suites' | 'performance' | 'reports' | 'config'>('overview');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSuites, setSelectedSuites] = useState<string[]>([]);
  const [testConfig, setTestConfig] = useState<TestConfiguration>({
    timeout: 30000,
    retries: 2,
    parallel: true,
    coverage: true,
    reporters: ['json', 'html'],
    environment: 'development',
    mockLevel: 'basic'
  });

  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'unit-components',
      name: 'Testes Unitários - Componentes',
      description: 'Testes dos componentes React principais',
      category: 'unit',
      status: 'idle',
      totalTests: 45,
      passedTests: 42,
      failedTests: 2,
      skippedTests: 1,
      duration: 12500,
      coverage: 85,
      tests: [
        {
          id: 'test-video-editor',
          name: 'VideoEditor Component',
          description: 'Testa renderização e funcionalidades básicas',
          status: 'passed',
          duration: 250,
          assertions: 8,
          tags: ['component', 'video'],
          priority: 'high'
        },
        {
          id: 'test-timeline',
          name: 'Timeline Component',
          description: 'Testa manipulação de timeline',
          status: 'passed',
          duration: 380,
          assertions: 12,
          tags: ['component', 'timeline'],
          priority: 'critical'
        },
        {
          id: 'test-effects',
          name: 'Effects System',
          description: 'Testa aplicação de efeitos',
          status: 'failed',
          duration: 180,
          assertions: 6,
          error: 'Effect preview not rendering correctly',
          tags: ['effects', 'render'],
          priority: 'high'
        }
      ]
    },
    {
      id: 'integration-api',
      name: 'Testes de Integração - API',
      description: 'Testes de integração com APIs externas',
      category: 'integration',
      status: 'idle',
      totalTests: 28,
      passedTests: 25,
      failedTests: 1,
      skippedTests: 2,
      duration: 8900,
      coverage: 78,
      tests: [
        {
          id: 'test-tts-api',
          name: 'TTS API Integration',
          description: 'Testa integração com serviços de TTS',
          status: 'passed',
          duration: 1200,
          assertions: 5,
          tags: ['api', 'tts'],
          priority: 'medium'
        },
        {
          id: 'test-render-api',
          name: 'Render API Integration',
          description: 'Testa pipeline de renderização',
          status: 'failed',
          duration: 850,
          assertions: 3,
          error: 'Timeout on video processing',
          tags: ['api', 'render'],
          priority: 'high'
        }
      ]
    },
    {
      id: 'e2e-workflows',
      name: 'Testes E2E - Workflows',
      description: 'Testes end-to-end dos fluxos principais',
      category: 'e2e',
      status: 'idle',
      totalTests: 15,
      passedTests: 13,
      failedTests: 0,
      skippedTests: 2,
      duration: 25600,
      coverage: 92,
      tests: [
        {
          id: 'test-full-workflow',
          name: 'Complete Video Creation',
          description: 'Workflow completo de criação de vídeo',
          status: 'passed',
          duration: 8500,
          assertions: 15,
          tags: ['workflow', 'video'],
          priority: 'critical'
        },
        {
          id: 'test-export-workflow',
          name: 'Video Export Flow',
          description: 'Processo completo de exportação',
          status: 'passed',
          duration: 12000,
          assertions: 10,
          tags: ['workflow', 'export'],
          priority: 'high'
        }
      ]
    },
    {
      id: 'performance-core',
      name: 'Testes de Performance - Core',
      description: 'Testes de performance dos componentes principais',
      category: 'performance',
      status: 'idle',
      totalTests: 12,
      passedTests: 10,
      failedTests: 1,
      skippedTests: 1,
      duration: 18400,
      coverage: 65,
      tests: [
        {
          id: 'test-render-performance',
          name: 'Render Performance',
          description: 'Testa performance de renderização',
          status: 'passed',
          duration: 5600,
          assertions: 4,
          tags: ['performance', 'render'],
          priority: 'high'
        },
        {
          id: 'test-memory-usage',
          name: 'Memory Usage',
          description: 'Monitora uso de memória',
          status: 'failed',
          duration: 3200,
          assertions: 3,
          error: 'Memory leak detected in effects system',
          tags: ['performance', 'memory'],
          priority: 'critical'
        }
      ]
    }
  ]);

  const [performanceTests, setPerformanceTests] = useState<PerformanceTest[]>([
    {
      id: 'load-test-1',
      name: 'Video Processing Load Test',
      type: 'load',
      status: 'completed',
      duration: 300000,
      metrics: {
        averageResponseTime: 2500,
        peakResponseTime: 4200,
        throughput: 12.5,
        errorRate: 0.8,
        memoryUsage: 75,
        cpuUsage: 68
      },
      thresholds: {
        responseTime: 3000,
        throughput: 10,
        errorRate: 2,
        memoryUsage: 85
      }
    },
    {
      id: 'stress-test-1',
      name: 'Concurrent Users Stress Test',
      type: 'stress',
      status: 'running',
      duration: 180000,
      metrics: {
        averageResponseTime: 3800,
        peakResponseTime: 7500,
        throughput: 8.2,
        errorRate: 3.2,
        memoryUsage: 92,
        cpuUsage: 85
      },
      thresholds: {
        responseTime: 5000,
        throughput: 5,
        errorRate: 5,
        memoryUsage: 95
      }
    }
  ]);

  const [testReports, setTestReports] = useState<TestReport[]>([
    {
      id: 'report-1',
      timestamp: new Date(Date.now() - 86400000),
      environment: 'development',
      totalSuites: 4,
      totalTests: 100,
      passed: 90,
      failed: 4,
      skipped: 6,
      coverage: 82,
      duration: 65400,
      suites: testSuites
    }
  ]);

  // Estatísticas calculadas
  const overallStats = useMemo(() => {
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalSkipped = testSuites.reduce((sum, suite) => sum + suite.skippedTests, 0);
    const averageCoverage = testSuites.reduce((sum, suite) => sum + (suite.coverage || 0), 0) / testSuites.length;
    const totalDuration = testSuites.reduce((sum, suite) => sum + suite.duration, 0);

    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped,
      averageCoverage,
      totalDuration,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
    };
  }, [testSuites]);

  // Executar suites selecionadas
  const runSelectedSuites = useCallback(async () => {
    if (selectedSuites.length === 0) return;

    setIsRunning(true);
    
    for (const suiteId of selectedSuites) {
      const suite = testSuites.find(s => s.id === suiteId);
      if (!suite) continue;

      // Simular execução da suite
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId ? { ...s, status: 'running' } : s
      ));

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular resultados
      const passed = Math.floor(suite.totalTests * 0.85);
      const failed = Math.floor(suite.totalTests * 0.1);
      const skipped = suite.totalTests - passed - failed;

      setTestSuites(prev => prev.map(s => 
        s.id === suiteId ? {
          ...s,
          status: failed > 0 ? 'failed' : 'completed',
          passedTests: passed,
          failedTests: failed,
          skippedTests: skipped,
          duration: Math.random() * 20000 + 5000
        } : s
      ));
    }

    setIsRunning(false);
  }, [selectedSuites, testSuites]);

  // Executar todos os testes
  const runAllTests = useCallback(async () => {
    setSelectedSuites(testSuites.map(s => s.id));
    await runSelectedSuites();
  }, [testSuites, runSelectedSuites]);

  // Executar teste de performance
  const runPerformanceTest = useCallback(async (testId: string) => {
    setPerformanceTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status: 'running' } : test
    ));

    // Simular execução
    await new Promise(resolve => setTimeout(resolve, 5000));

    setPerformanceTests(prev => prev.map(test => 
      test.id === testId ? {
        ...test,
        status: 'completed',
        metrics: {
          averageResponseTime: Math.random() * 2000 + 1000,
          peakResponseTime: Math.random() * 3000 + 2000,
          throughput: Math.random() * 15 + 5,
          errorRate: Math.random() * 3,
          memoryUsage: Math.random() * 30 + 60,
          cpuUsage: Math.random() * 40 + 50
        }
      } : test
    ));
  }, []);

  // Formatadores
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'unit': return <TestTube2 className="w-4 h-4" />;
      case 'integration': return <Grid className="w-4 h-4" />;
      case 'e2e': return <Activity className="w-4 h-4" />;
      case 'performance': return <Gauge className="w-4 h-4" />;
      case 'accessibility': return <Eye className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Sistema Abrangente de Testes</h2>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Executar Todos
                </>
              )}
            </Button>
            
            <Button
              onClick={runSelectedSuites}
              disabled={isRunning || selectedSuites.length === 0}
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 border-blue-500"
            >
              <Target className="w-4 h-4 mr-2" />
              Executar Selecionados
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="overview" className="text-sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="suites" className="text-sm">
              <TestTube2 className="w-4 h-4 mr-1" />
              Suites
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-sm">
              <Gauge className="w-4 h-4 mr-1" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-sm">
              <FileText className="w-4 h-4 mr-1" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="config" className="text-sm">
              <Settings className="w-4 h-4 mr-1" />
              Configurações
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          {/* Visão Geral */}
          <TabsContent value="overview" className="h-full p-4 overflow-y-auto space-y-6">
            {/* Estatísticas principais */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total de Testes</p>
                      <p className="text-2xl font-bold text-white">{overallStats.totalTests}</p>
                    </div>
                    <TestTube2 className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Taxa de Sucesso</p>
                      <p className="text-2xl font-bold text-green-400">
                        {Math.round(overallStats.successRate)}%
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Cobertura</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {Math.round(overallStats.averageCoverage)}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Duração</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {formatDuration(overallStats.totalDuration)}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribuição por status */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Distribuição dos Testes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Aprovados</span>
                      <span className="text-green-400">{overallStats.totalPassed}</span>
                    </div>
                    <Progress 
                      value={(overallStats.totalPassed / overallStats.totalTests) * 100} 
                      className="h-2" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Falharam</span>
                      <span className="text-red-400">{overallStats.totalFailed}</span>
                    </div>
                    <Progress 
                      value={(overallStats.totalFailed / overallStats.totalTests) * 100} 
                      className="h-2" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Ignorados</span>
                      <span className="text-yellow-400">{overallStats.totalSkipped}</span>
                    </div>
                    <Progress 
                      value={(overallStats.totalSkipped / overallStats.totalTests) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suites por categoria */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <Grid className="w-5 h-5 mr-2" />
                  Suites por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {testSuites.map(suite => (
                    <div
                      key={suite.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(suite.category)}
                        <div>
                          <h4 className="text-white font-medium text-sm">{suite.name}</h4>
                          <p className="text-xs text-gray-400">{suite.totalTests} testes</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(suite.status)}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            suite.status === 'completed' ? 'border-green-500 text-green-400' :
                            suite.status === 'failed' ? 'border-red-500 text-red-400' :
                            suite.status === 'running' ? 'border-blue-500 text-blue-400' :
                            'border-gray-500 text-gray-400'
                          }`}
                        >
                          {suite.passedTests}/{suite.totalTests}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suites de Testes */}
          <TabsContent value="suites" className="h-full p-4 overflow-y-auto space-y-6">
            {testSuites.map(suite => (
              <Card key={suite.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base flex items-center">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSuites.includes(suite.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuites(prev => [...prev, suite.id]);
                            } else {
                              setSelectedSuites(prev => prev.filter(id => id !== suite.id));
                            }
                          }}
                          className="rounded"
                        />
                        {getCategoryIcon(suite.category)}
                        <span>{suite.name}</span>
                      </label>
                    </CardTitle>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${
                        suite.category === 'unit' ? 'bg-blue-600' :
                        suite.category === 'integration' ? 'bg-purple-600' :
                        suite.category === 'e2e' ? 'bg-green-600' :
                        suite.category === 'performance' ? 'bg-orange-600' :
                        'bg-gray-600'
                      }`}>
                        {suite.category}
                      </Badge>
                      {getStatusIcon(suite.status)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{suite.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-lg font-semibold text-white">{suite.totalTests}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Aprovados</p>
                      <p className="text-lg font-semibold text-green-400">{suite.passedTests}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Falharam</p>
                      <p className="text-lg font-semibold text-red-400">{suite.failedTests}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Cobertura</p>
                      <p className="text-lg font-semibold text-purple-400">{suite.coverage}%</p>
                    </div>
                  </div>

                  {suite.tests.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-300">Testes Recentes</h5>
                      {suite.tests.slice(0, 3).map(test => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(test.status)}
                            <div>
                              <p className="text-sm text-white">{test.name}</p>
                              <p className="text-xs text-gray-400">{test.description}</p>
                              {test.error && (
                                <p className="text-xs text-red-400 mt-1">❌ {test.error}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xs text-gray-400">{formatDuration(test.duration)}</p>
                            <div className="flex space-x-1 mt-1">
                              {test.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Testes de Performance */}
          <TabsContent value="performance" className="h-full p-4 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {performanceTests.map(test => (
                <Card key={test.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base flex items-center">
                        <Gauge className="w-5 h-5 mr-2" />
                        {test.name}
                      </CardTitle>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${
                          test.type === 'load' ? 'bg-blue-600' :
                          test.type === 'stress' ? 'bg-red-600' :
                          test.type === 'spike' ? 'bg-orange-600' :
                          test.type === 'volume' ? 'bg-purple-600' :
                          'bg-green-600'
                        }`}>
                          {test.type}
                        </Badge>
                        {getStatusIcon(test.status)}
                        <Button
                          size="sm"
                          onClick={() => runPerformanceTest(test.id)}
                          disabled={test.status === 'running'}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-300">Métricas</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Tempo Médio de Resposta</span>
                            <span className={`text-sm ${
                              test.metrics.averageResponseTime <= test.thresholds.responseTime 
                                ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {test.metrics.averageResponseTime}ms
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Throughput</span>
                            <span className={`text-sm ${
                              test.metrics.throughput >= test.thresholds.throughput 
                                ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {test.metrics.throughput} req/s
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Taxa de Erro</span>
                            <span className={`text-sm ${
                              test.metrics.errorRate <= test.thresholds.errorRate 
                                ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {test.metrics.errorRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Uso de Memória</span>
                            <span className={`text-sm ${
                              test.metrics.memoryUsage <= test.thresholds.memoryUsage 
                                ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {test.metrics.memoryUsage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-300">Limiares</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Tempo de Resposta Max</span>
                            <span className="text-sm text-white">{test.thresholds.responseTime}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Throughput Min</span>
                            <span className="text-sm text-white">{test.thresholds.throughput} req/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Taxa de Erro Max</span>
                            <span className="text-sm text-white">{test.thresholds.errorRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Memória Max</span>
                            <span className="text-sm text-white">{test.thresholds.memoryUsage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {test.status === 'running' && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Progresso</span>
                          <span className="text-white">
                            {formatDuration(test.duration)} / {formatDuration(300000)}
                          </span>
                        </div>
                        <Progress value={(test.duration / 300000) * 100} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="reports" className="h-full p-4 overflow-y-auto space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Histórico de Relatórios
                  </div>
                  <Button variant="outline" className="bg-gray-700 border-gray-600">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testReports.map(report => (
                    <div
                      key={report.id}
                      className="p-4 bg-gray-700 rounded border border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-medium">
                            Relatório - {report.timestamp.toLocaleDateString()}
                          </h4>
                          <p className="text-sm text-gray-400">
                            Ambiente: {report.environment} | Duração: {formatDuration(report.duration)}
                          </p>
                        </div>
                        <Badge className="bg-green-600">
                          {Math.round((report.passed / report.totalTests) * 100)}% Sucesso
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Total</p>
                          <p className="text-lg font-semibold text-white">{report.totalTests}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Aprovados</p>
                          <p className="text-lg font-semibold text-green-400">{report.passed}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Falharam</p>
                          <p className="text-lg font-semibold text-red-400">{report.failed}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Ignorados</p>
                          <p className="text-lg font-semibold text-yellow-400">{report.skipped}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Cobertura</p>
                          <p className="text-lg font-semibold text-purple-400">{report.coverage}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="config" className="h-full p-4 overflow-y-auto space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações de Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Timeout (ms): {testConfig.timeout}
                    </label>
                    <input
                      type="range"
                      min="5000"
                      max="120000"
                      step="5000"
                      value={testConfig.timeout}
                      onChange={(e) => setTestConfig(prev => ({ 
                        ...prev, 
                        timeout: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Tentativas: {testConfig.retries}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={testConfig.retries}
                      onChange={(e) => setTestConfig(prev => ({ 
                        ...prev, 
                        retries: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Ambiente</label>
                  <select
                    value={testConfig.environment}
                    onChange={(e) => setTestConfig(prev => ({ 
                      ...prev, 
                      environment: e.target.value as any 
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="development">Desenvolvimento</option>
                    <option value="staging">Homologação</option>
                    <option value="production">Produção</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={testConfig.parallel}
                      onChange={(e) => setTestConfig(prev => ({ 
                        ...prev, 
                        parallel: e.target.checked 
                      }))}
                      className="rounded"
                    />
                    <span className="text-white text-sm">Execução em Paralelo</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={testConfig.coverage}
                      onChange={(e) => setTestConfig(prev => ({ 
                        ...prev, 
                        coverage: e.target.checked 
                      }))}
                      className="rounded"
                    />
                    <span className="text-white text-sm">Análise de Cobertura</span>
                  </label>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => onConfigChange(testConfig)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Configurações
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setTestConfig({
                      timeout: 30000,
                      retries: 2,
                      parallel: true,
                      coverage: true,
                      reporters: ['json', 'html'],
                      environment: 'development',
                      mockLevel: 'basic'
                    })}
                    className="bg-gray-700 border-gray-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restaurar Padrões
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ComprehensiveTestSystem;