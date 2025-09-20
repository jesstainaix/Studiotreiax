import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  Volume2,
  Video,
  Image,
  FileText,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  AlertCircle,
  Target,
  Gauge,
  Activity,
  Eye,
  Headphones,
  Monitor,
  Smartphone,
  Tablet,
  Tv
} from 'lucide-react';

// Interfaces para garantia de qualidade
interface QualityIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'video' | 'audio' | 'performance' | 'compatibility' | 'accessibility';
  title: string;
  description: string;
  location: {
    timestamp?: number;
    track?: string;
    element?: string;
  };
  severity: number; // 1-10
  autoFixable: boolean;
  recommendation: string;
  impact: {
    userExperience: number;
    performance: number;
    accessibility: number;
  };
}

interface QualityStandard {
  id: string;
  name: string;
  category: string;
  requirements: {
    videoResolution?: { min: string; max: string; };
    videoBitrate?: { min: number; max: number; };
    audioSampleRate?: number;
    audioBitrate?: { min: number; max: number; };
    duration?: { min: number; max: number; };
    aspectRatio?: string[];
    frameRate?: number[];
    colorSpace?: string[];
  };
  compliance: boolean;
  score: number;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuUsage: number;
  fileSize: number;
  loadTime: number;
  playbackSmooth: boolean;
  bufferingEvents: number;
  qualityScore: number;
}

interface CompatibilityCheck {
  platform: string;
  device: string;
  browser?: string;
  supported: boolean;
  issues: string[];
  recommendations: string[];
  marketShare: number;
}

interface QualityReport {
  id: string;
  timestamp: Date;
  overallScore: number;
  issues: QualityIssue[];
  standards: QualityStandard[];
  performance: PerformanceMetrics;
  compatibility: CompatibilityCheck[];
  recommendations: string[];
  exportReady: boolean;
}

interface QualityAssuranceProps {
  videoElement?: HTMLVideoElement;
  projectData?: any;
  onIssueFixed?: (issueId: string) => void;
  onExportReport?: (report: QualityReport) => void;
  className?: string;
}

const QualityAssurance: React.FC<QualityAssuranceProps> = ({
  videoElement,
  projectData,
  onIssueFixed,
  onExportReport,
  className = ''
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedStandard, setSelectedStandard] = useState<string>('youtube');
  const [autoFix, setAutoFix] = useState(false);
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);

  // Executar análise de qualidade completa
  const runQualityAnalysis = async () => {
    if (!videoElement) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Análise de problemas técnicos
      setAnalysisProgress(20);
      const issues = await analyzeQualityIssues();
      
      // Verificação de padrões
      setAnalysisProgress(40);
      const standards = await checkQualityStandards();
      
      // Métricas de performance
      setAnalysisProgress(60);
      const performance = await analyzePerformance();
      
      // Verificação de compatibilidade
      setAnalysisProgress(80);
      const compatibility = await checkCompatibility();
      
      // Gerar relatório final
      setAnalysisProgress(90);
      const report = await generateQualityReport(issues, standards, performance, compatibility);
      
      setQualityReport(report);
      setAnalysisProgress(100);
    } catch (error) {
      console.error('Erro na análise de qualidade:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analisar problemas de qualidade
  const analyzeQualityIssues = (): Promise<QualityIssue[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const issues: QualityIssue[] = [
          {
            id: 'low-audio-quality',
            type: 'warning',
            category: 'audio',
            title: 'Qualidade de Áudio Baixa',
            description: 'Detectado áudio com bitrate abaixo do recomendado (128 kbps)',
            location: { timestamp: 45.2, track: 'audio-1' },
            severity: 6,
            autoFixable: true,
            recommendation: 'Aumentar bitrate para 192 kbps ou superior',
            impact: {
              userExperience: 7,
              performance: 2,
              accessibility: 5
            }
          },
          {
            id: 'frame-drops',
            type: 'critical',
            category: 'video',
            title: 'Perda de Frames Detectada',
            description: 'Identificados 23 frames perdidos entre 1:15 e 1:45',
            location: { timestamp: 75, track: 'video-1' },
            severity: 8,
            autoFixable: false,
            recommendation: 'Re-renderizar o segmento com configurações otimizadas',
            impact: {
              userExperience: 9,
              performance: 6,
              accessibility: 3
            }
          },
          {
            id: 'color-space-mismatch',
            type: 'warning',
            category: 'video',
            title: 'Incompatibilidade de Espaço de Cor',
            description: 'Mistura de espaços de cor sRGB e Rec.709 detectada',
            location: { element: 'clip-3' },
            severity: 5,
            autoFixable: true,
            recommendation: 'Padronizar para Rec.709 para melhor compatibilidade',
            impact: {
              userExperience: 6,
              performance: 1,
              accessibility: 2
            }
          },
          {
            id: 'large-file-size',
            type: 'info',
            category: 'performance',
            title: 'Tamanho de Arquivo Elevado',
            description: 'Arquivo final estimado em 2.3GB, pode afetar carregamento',
            location: {},
            severity: 4,
            autoFixable: true,
            recommendation: 'Otimizar compressão ou reduzir bitrate',
            impact: {
              userExperience: 5,
              performance: 8,
              accessibility: 6
            }
          },
          {
            id: 'missing-captions',
            type: 'warning',
            category: 'accessibility',
            title: 'Legendas Ausentes',
            description: 'Conteúdo falado detectado sem legendas correspondentes',
            location: { timestamp: 30 },
            severity: 7,
            autoFixable: false,
            recommendation: 'Adicionar legendas para melhorar acessibilidade',
            impact: {
              userExperience: 4,
              performance: 0,
              accessibility: 10
            }
          },
          {
            id: 'mobile-compatibility',
            type: 'info',
            category: 'compatibility',
            title: 'Otimização Mobile Recomendada',
            description: 'Resolução alta pode causar problemas em dispositivos móveis',
            location: {},
            severity: 3,
            autoFixable: true,
            recommendation: 'Criar versão otimizada para mobile (720p)',
            impact: {
              userExperience: 6,
              performance: 7,
              accessibility: 4
            }
          }
        ];
        resolve(issues);
      }, 1500);
    });
  };

  // Verificar padrões de qualidade
  const checkQualityStandards = (): Promise<QualityStandard[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const standards: QualityStandard[] = [
          {
            id: 'youtube',
            name: 'YouTube Recomendado',
            category: 'Plataforma',
            requirements: {
              videoResolution: { min: '1280x720', max: '3840x2160' },
              videoBitrate: { min: 5000, max: 68000 },
              audioSampleRate: 48000,
              audioBitrate: { min: 128, max: 320 },
              frameRate: [24, 25, 30, 50, 60],
              aspectRatio: ['16:9', '4:3'],
              colorSpace: ['Rec.709', 'sRGB']
            },
            compliance: true,
            score: 92
          },
          {
            id: 'broadcast',
            name: 'Padrão Broadcast',
            category: 'Profissional',
            requirements: {
              videoResolution: { min: '1920x1080', max: '3840x2160' },
              videoBitrate: { min: 25000, max: 100000 },
              audioSampleRate: 48000,
              audioBitrate: { min: 256, max: 320 },
              frameRate: [25, 29.97, 50, 59.94],
              aspectRatio: ['16:9'],
              colorSpace: ['Rec.709', 'Rec.2020']
            },
            compliance: false,
            score: 78
          },
          {
            id: 'web-optimized',
            name: 'Web Otimizado',
            category: 'Internet',
            requirements: {
              videoResolution: { min: '854x480', max: '1920x1080' },
              videoBitrate: { min: 1000, max: 8000 },
              audioSampleRate: 44100,
              audioBitrate: { min: 96, max: 192 },
              duration: { min: 15, max: 600 },
              frameRate: [24, 30],
              aspectRatio: ['16:9', '1:1', '9:16']
            },
            compliance: true,
            score: 88
          },
          {
            id: 'accessibility',
            name: 'Acessibilidade WCAG',
            category: 'Acessibilidade',
            requirements: {
              audioSampleRate: 22050,
              audioBitrate: { min: 64, max: 128 }
            },
            compliance: false,
            score: 65
          }
        ];
        resolve(standards);
      }, 1000);
    });
  };

  // Analisar performance
  const analyzePerformance = (): Promise<PerformanceMetrics> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const metrics: PerformanceMetrics = {
          renderTime: 145.7,
          memoryUsage: 2.3,
          cpuUsage: 67,
          gpuUsage: 45,
          fileSize: 2.3 * 1024 * 1024 * 1024, // 2.3GB em bytes
          loadTime: 8.2,
          playbackSmooth: true,
          bufferingEvents: 2,
          qualityScore: 84
        };
        resolve(metrics);
      }, 800);
    });
  };

  // Verificar compatibilidade
  const checkCompatibility = (): Promise<CompatibilityCheck[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const compatibility: CompatibilityCheck[] = [
          {
            platform: 'Desktop',
            device: 'Windows PC',
            browser: 'Chrome',
            supported: true,
            issues: [],
            recommendations: ['Otimizar para GPUs integradas'],
            marketShare: 35.2
          },
          {
            platform: 'Mobile',
            device: 'Android',
            browser: 'Chrome Mobile',
            supported: true,
            issues: ['Alto consumo de bateria'],
            recommendations: ['Reduzir resolução para 720p', 'Otimizar codec'],
            marketShare: 28.7
          },
          {
            platform: 'Mobile',
            device: 'iPhone',
            browser: 'Safari',
            supported: true,
            issues: ['Limitações de codec H.265'],
            recommendations: ['Usar H.264 para melhor compatibilidade'],
            marketShare: 18.9
          },
          {
            platform: 'Smart TV',
            device: 'Samsung Tizen',
            supported: false,
            issues: ['Codec não suportado', 'Resolução muito alta'],
            recommendations: ['Converter para H.264', 'Limitar a 1080p'],
            marketShare: 8.1
          },
          {
            platform: 'Tablet',
            device: 'iPad',
            browser: 'Safari',
            supported: true,
            issues: [],
            recommendations: ['Otimizar para tela Retina'],
            marketShare: 9.1
          }
        ];
        resolve(compatibility);
      }, 1200);
    });
  };

  // Gerar relatório de qualidade
  const generateQualityReport = async (
    issues: QualityIssue[],
    standards: QualityStandard[],
    performance: PerformanceMetrics,
    compatibility: CompatibilityCheck[]
  ): Promise<QualityReport> => {
    const criticalIssues = issues.filter(i => i.type === 'critical').length;
    const warningIssues = issues.filter(i => i.type === 'warning').length;
    
    // Calcular score geral
    const standardsScore = standards.reduce((acc, s) => acc + s.score, 0) / standards.length;
    const issuesScore = Math.max(0, 100 - (criticalIssues * 15 + warningIssues * 5));
    const performanceScore = performance.qualityScore;
    const compatibilityScore = (compatibility.filter(c => c.supported).length / compatibility.length) * 100;
    
    const overallScore = Math.round((standardsScore + issuesScore + performanceScore + compatibilityScore) / 4);
    
    const recommendations = [
      'Corrigir problemas críticos antes da exportação final',
      'Implementar legendas para melhorar acessibilidade',
      'Otimizar compressão para reduzir tamanho do arquivo',
      'Testar reprodução em diferentes dispositivos',
      'Considerar múltiplas versões para diferentes plataformas'
    ];
    
    return {
      id: `qa-report-${Date.now()}`,
      timestamp: new Date(),
      overallScore,
      issues,
      standards,
      performance,
      compatibility,
      recommendations,
      exportReady: criticalIssues === 0 && overallScore >= 80
    };
  };

  // Corrigir problema automaticamente
  const autoFixIssue = async (issue: QualityIssue) => {
    if (!issue.autoFixable) return;
    
    // Simular correção automática
    await new Promise(resolve => setTimeout(resolve, 2000));
    onIssueFixed?.(issue.id);
  };

  // Exportar relatório
  const exportReport = () => {
    if (qualityReport) {
      onExportReport?.(qualityReport);
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Volume2 className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'compatibility': return <Monitor className="h-4 w-4" />;
      case 'accessibility': return <Eye className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.includes('PC') || device.includes('Windows')) return <Monitor className="h-5 w-5" />;
    if (device.includes('Android') || device.includes('iPhone')) return <Smartphone className="h-5 w-5" />;
    if (device.includes('iPad') || device.includes('Tablet')) return <Tablet className="h-5 w-5" />;
    if (device.includes('TV')) return <Tv className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const filteredIssues = qualityReport?.issues.filter(issue => 
    !showOnlyCritical || issue.type === 'critical'
  ) || [];

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Garantia de Qualidade
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={runQualityAnalysis}
                disabled={!videoElement || isAnalyzing}
                size="sm"
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Target className="h-4 w-4 mr-2" />
                )}
                {isAnalyzing ? 'Analisando...' : 'Executar Análise'}
              </Button>
              {qualityReport && (
                <Button onClick={exportReport} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Relatório
                </Button>
              )}
            </div>
          </div>
          {isAnalyzing && (
            <div className="mt-4">
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Executando análise completa de qualidade e compatibilidade...
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {qualityReport ? (
            <div className="space-y-6">
              {/* Score Geral */}
              <Card className={`p-6 ${qualityReport.exportReady ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-2">
                      {qualityReport.overallScore}%
                    </div>
                    <p className="text-muted-foreground">Score de Qualidade Geral</p>
                  </div>
                  <div className="text-right">
                    {qualityReport.exportReady ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Pronto para Exportar</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Requer Atenção</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Tabs defaultValue="issues" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="issues" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Problemas ({filteredIssues.length})
                  </TabsTrigger>
                  <TabsTrigger value="standards" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Padrões
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="compatibility" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Compatibilidade
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="issues" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="destructive">
                          {qualityReport.issues.filter(i => i.type === 'critical').length} Críticos
                        </Badge>
                        <Badge variant="secondary">
                          {qualityReport.issues.filter(i => i.type === 'warning').length} Avisos
                        </Badge>
                        <Badge variant="outline">
                          {qualityReport.issues.filter(i => i.type === 'info').length} Informativos
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowOnlyCritical(!showOnlyCritical)}
                      >
                        {showOnlyCritical ? 'Mostrar Todos' : 'Apenas Críticos'}
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {filteredIssues.map((issue) => (
                          <Card key={issue.id} className={`p-4 ${getIssueColor(issue.type)}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getIssueIcon(issue.type)}
                                  {getCategoryIcon(issue.category)}
                                  <h4 className="font-medium">{issue.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    Severidade: {issue.severity}/10
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {issue.description}
                                </p>
                                {issue.location.timestamp && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    📍 Tempo: {Math.floor(issue.location.timestamp / 60)}:{(issue.location.timestamp % 60).toFixed(1).padStart(4, '0')}s
                                  </p>
                                )}
                                <div className="bg-white/50 p-2 rounded text-xs">
                                  <strong>Recomendação:</strong> {issue.recommendation}
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">UX Impact:</span>
                                    <p className="font-medium">{issue.impact.userExperience}/10</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Performance:</span>
                                    <p className="font-medium">{issue.impact.performance}/10</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Acessibilidade:</span>
                                    <p className="font-medium">{issue.impact.accessibility}/10</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 ml-4">
                                {issue.autoFixable && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => autoFixIssue(issue)}
                                  >
                                    Auto-Corrigir
                                  </Button>
                                )}
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="standards" className="mt-4">
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {qualityReport.standards.map((standard) => (
                        <Card key={standard.id} className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{standard.name}</h4>
                                <Badge variant="outline">{standard.category}</Badge>
                                {standard.compliance ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Score:</span>
                                <span className="font-medium">{standard.score}%</span>
                                <Progress value={standard.score} className="w-24 h-2" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {standard.requirements.videoResolution && (
                              <div>
                                <span className="text-muted-foreground">Resolução:</span>
                                <p>{standard.requirements.videoResolution.min} - {standard.requirements.videoResolution.max}</p>
                              </div>
                            )}
                            {standard.requirements.videoBitrate && (
                              <div>
                                <span className="text-muted-foreground">Bitrate Vídeo:</span>
                                <p>{standard.requirements.videoBitrate.min} - {standard.requirements.videoBitrate.max} kbps</p>
                              </div>
                            )}
                            {standard.requirements.audioBitrate && (
                              <div>
                                <span className="text-muted-foreground">Bitrate Áudio:</span>
                                <p>{standard.requirements.audioBitrate.min} - {standard.requirements.audioBitrate.max} kbps</p>
                              </div>
                            )}
                            {standard.requirements.frameRate && (
                              <div>
                                <span className="text-muted-foreground">Frame Rate:</span>
                                <p>{standard.requirements.frameRate.join(', ')} fps</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="performance" className="mt-4">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-4 text-center">
                        <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{qualityReport.performance.renderTime}s</p>
                        <p className="text-sm text-muted-foreground">Tempo de Render</p>
                      </Card>
                      <Card className="p-4 text-center">
                        <Activity className="h-6 w-6 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{qualityReport.performance.memoryUsage}GB</p>
                        <p className="text-sm text-muted-foreground">Uso de Memória</p>
                      </Card>
                      <Card className="p-4 text-center">
                        <Gauge className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{qualityReport.performance.cpuUsage}%</p>
                        <p className="text-sm text-muted-foreground">Uso de CPU</p>
                      </Card>
                      <Card className="p-4 text-center">
                        <BarChart3 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{qualityReport.performance.gpuUsage}%</p>
                        <p className="text-sm text-muted-foreground">Uso de GPU</p>
                      </Card>
                    </div>
                    
                    <Card className="p-4">
                      <h4 className="font-medium mb-4">Métricas Detalhadas</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Tamanho do Arquivo</span>
                          <span className="font-medium">
                            {(qualityReport.performance.fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tempo de Carregamento</span>
                          <span className="font-medium">{qualityReport.performance.loadTime}s</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Reprodução Suave</span>
                          <span className={`font-medium ${qualityReport.performance.playbackSmooth ? 'text-green-600' : 'text-red-600'}`}>
                            {qualityReport.performance.playbackSmooth ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Eventos de Buffer</span>
                          <span className="font-medium">{qualityReport.performance.bufferingEvents}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Score de Qualidade</span>
                          <div className="flex items-center gap-2">
                            <Progress value={qualityReport.performance.qualityScore} className="w-24 h-2" />
                            <span className="font-medium">{qualityReport.performance.qualityScore}%</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="compatibility" className="mt-4">
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {qualityReport.compatibility.map((check, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getDeviceIcon(check.device)}
                              <div>
                                <h4 className="font-medium">{check.device}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {check.platform} {check.browser && `• ${check.browser}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{check.marketShare}% mercado</Badge>
                              {check.supported ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          </div>
                          
                          {check.issues.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium mb-2">Problemas:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {check.issues.map((issue, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <Minus className="h-3 w-3" />
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {check.recommendations.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Recomendações:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {check.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Recomendações Gerais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recomendações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {qualityReport.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : !isAnalyzing ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Garantia de Qualidade</h3>
              <p className="text-muted-foreground mb-6">
                Execute uma análise completa para verificar problemas técnicos, conformidade com padrões e compatibilidade
              </p>
              <Button 
                onClick={runQualityAnalysis}
                disabled={!videoElement}
                size="lg"
              >
                <Target className="h-5 w-5 mr-2" />
                Iniciar Análise de Qualidade
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityAssurance;