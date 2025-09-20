import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Eye,
  EyeOff,
  Ear,
  Hand,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Download,
  RefreshCw,
  Play,
  Pause,
  Zap,
  Target,
  Users,
  Shield,
  Accessibility,
  Volume2,
  Type,
  Palette,
  MousePointer,
} from 'lucide-react';

// Interfaces para análise de acessibilidade
interface AccessibilityIssue {
  id: string;
  type: 'visual' | 'auditory' | 'motor' | 'cognitive';
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
  element: string;
  description: string;
  impact: string;
  solution: string;
  automated: boolean;
  fixed: boolean;
}

interface AccessibilityMetrics {
  overallScore: number;
  wcagCompliance: {
    A: number;
    AA: number;
    AAA: number;
  };
  categoryScores: {
    visual: number;
    auditory: number;
    motor: number;
    cognitive: number;
  };
  issueCount: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  automatedCoverage: number;
}

interface AccessibilityConfig {
  autoFix: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA';
  includeCategories: {
    visual: boolean;
    auditory: boolean;
    motor: boolean;
    cognitive: boolean;
  };
  colorContrast: {
    enabled: boolean;
    ratio: number;
  };
  fontSize: {
    enabled: boolean;
    minSize: number;
  };
  focusIndicators: boolean;
  altText: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
}

interface UserProfile {
  disabilities: string[];
  assistiveTech: string[];
  preferences: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
  };
}

const AccessibilityAnalyzer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [metrics, setMetrics] = useState<AccessibilityMetrics>({
    overallScore: 0,
    wcagCompliance: { A: 0, AA: 0, AAA: 0 },
    categoryScores: { visual: 0, auditory: 0, motor: 0, cognitive: 0 },
    issueCount: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    automatedCoverage: 0,
  });
  const [config, setConfig] = useState<AccessibilityConfig>({
    autoFix: false,
    wcagLevel: 'AA',
    includeCategories: {
      visual: true,
      auditory: true,
      motor: true,
      cognitive: true,
    },
    colorContrast: {
      enabled: true,
      ratio: 4.5,
    },
    fontSize: {
      enabled: true,
      minSize: 16,
    },
    focusIndicators: true,
    altText: true,
    keyboardNavigation: true,
    screenReader: true,
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    disabilities: [],
    assistiveTech: [],
    preferences: {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
    },
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  // Simular análise de acessibilidade
  useEffect(() => {
    if (isAnalyzing) {
      const mockIssues: AccessibilityIssue[] = [
        {
          id: '1',
          type: 'visual',
          severity: 'critical',
          wcagLevel: 'AA',
          wcagCriterion: '1.4.3 Contrast (Minimum)',
          element: 'button.primary',
          description: 'Contraste insuficiente entre texto e fundo',
          impact: 'Usuários com baixa visão podem não conseguir ler o texto',
          solution: 'Aumentar o contraste para pelo menos 4.5:1',
          automated: true,
          fixed: false,
        },
        {
          id: '2',
          type: 'motor',
          severity: 'serious',
          wcagLevel: 'A',
          wcagCriterion: '2.1.1 Keyboard',
          element: 'div.modal',
          description: 'Elemento não acessível via teclado',
          impact: 'Usuários que dependem do teclado não podem interagir',
          solution: 'Adicionar tabindex e handlers de teclado',
          automated: true,
          fixed: false,
        },
        {
          id: '3',
          type: 'visual',
          severity: 'serious',
          wcagLevel: 'A',
          wcagCriterion: '1.1.1 Non-text Content',
          element: 'img.hero',
          description: 'Imagem sem texto alternativo',
          impact: 'Usuários de leitores de tela não sabem o conteúdo da imagem',
          solution: 'Adicionar atributo alt descritivo',
          automated: true,
          fixed: false,
        },
        {
          id: '4',
          type: 'cognitive',
          severity: 'moderate',
          wcagLevel: 'AAA',
          wcagCriterion: '3.1.5 Reading Level',
          element: 'p.description',
          description: 'Texto com nível de leitura muito avançado',
          impact: 'Usuários com dificuldades cognitivas podem ter problemas',
          solution: 'Simplificar linguagem e estrutura',
          automated: false,
          fixed: false,
        },
        {
          id: '5',
          type: 'auditory',
          severity: 'serious',
          wcagLevel: 'A',
          wcagCriterion: '1.2.2 Captions (Prerecorded)',
          element: 'video.tutorial',
          description: 'Vídeo sem legendas',
          impact: 'Usuários surdos ou com deficiência auditiva não podem acessar o conteúdo',
          solution: 'Adicionar legendas sincronizadas',
          automated: false,
          fixed: false,
        },
      ];
      
      setIssues(mockIssues);
      
      // Calcular métricas
      const criticalCount = mockIssues.filter(i => i.severity === 'critical').length;
      const seriousCount = mockIssues.filter(i => i.severity === 'serious').length;
      const moderateCount = mockIssues.filter(i => i.severity === 'moderate').length;
      const minorCount = mockIssues.filter(i => i.severity === 'minor').length;
      
      const totalIssues = mockIssues.length;
      const overallScore = Math.max(0, 100 - (criticalCount * 25 + seriousCount * 15 + moderateCount * 10 + minorCount * 5));
      
      setMetrics({
        overallScore,
        wcagCompliance: {
          A: 75,
          AA: 60,
          AAA: 40,
        },
        categoryScores: {
          visual: 70,
          auditory: 50,
          motor: 80,
          cognitive: 65,
        },
        issueCount: {
          critical: criticalCount,
          serious: seriousCount,
          moderate: moderateCount,
          minor: minorCount,
        },
        automatedCoverage: (mockIssues.filter(i => i.automated).length / totalIssues) * 100,
      });
      
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  // Handlers
  const startAnalysis = () => {
    setIsAnalyzing(true);
    setIssues([]);
  };

  const fixIssue = (id: string) => {
    setIssues(prev =>
      prev.map(issue => issue.id === id ? { ...issue, fixed: true } : issue)
    );
  };

  const autoFixIssues = () => {
    const automatedIssues = issues.filter(issue => issue.automated && !issue.fixed);
    automatedIssues.forEach(issue => fixIssue(issue.id));
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      issues: issues.filter(i => !i.fixed),
      config,
      userProfile,
      recommendations: generateRecommendations(),
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${Date.now()}.json`;
    a.click();
  };

  const generateRecommendations = () => {
    const recommendations = [];
    
    if (metrics.categoryScores.visual < 70) {
      recommendations.push('Melhorar contraste de cores e legibilidade');
    }
    if (metrics.categoryScores.motor < 70) {
      recommendations.push('Implementar navegação por teclado completa');
    }
    if (metrics.categoryScores.auditory < 70) {
      recommendations.push('Adicionar legendas e transcrições para conteúdo de áudio');
    }
    if (metrics.categoryScores.cognitive < 70) {
      recommendations.push('Simplificar linguagem e melhorar estrutura de conteúdo');
    }
    
    return recommendations;
  };

  // Valores computados
  const unfixedIssues = useMemo(() => issues.filter(i => !i.fixed), [issues]);
  const criticalIssues = useMemo(() => unfixedIssues.filter(i => i.severity === 'critical'), [unfixedIssues]);
  const automatedIssues = useMemo(() => unfixedIssues.filter(i => i.automated), [unfixedIssues]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'serious': return 'bg-orange-100 text-orange-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'minor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visual': return <Eye className="w-4 h-4" />;
      case 'auditory': return <Ear className="w-4 h-4" />;
      case 'motor': return <Hand className="w-4 h-4" />;
      case 'cognitive': return <Brain className="w-4 h-4" />;
      default: return <Accessibility className="w-4 h-4" />;
    }
  };

  const radarData = [
    { category: 'Visual', score: metrics.categoryScores.visual },
    { category: 'Auditivo', score: metrics.categoryScores.auditory },
    { category: 'Motor', score: metrics.categoryScores.motor },
    { category: 'Cognitivo', score: metrics.categoryScores.cognitive },
  ];

  const wcagData = [
    { level: 'A', compliance: metrics.wcagCompliance.A },
    { level: 'AA', compliance: metrics.wcagCompliance.AA },
    { level: 'AAA', compliance: metrics.wcagCompliance.AAA },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analisador de Acessibilidade</h1>
          <p className="text-gray-600 mt-1">
            Garanta que sua plataforma seja acessível para todos os usuários
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isAnalyzing ? 'Analisando...' : 'Iniciar Análise'}
          </Button>
          {automatedIssues.length > 0 && (
            <Button onClick={autoFixIssues} variant="outline" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Corrigir Automaticamente
            </Button>
          )}
          <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score Geral</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {Math.round(metrics.overallScore)}%
                </p>
              </div>
              <Shield className={`w-8 h-8 ${getScoreColor(metrics.overallScore)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Problemas Críticos</p>
                <p className={`text-2xl font-bold ${criticalIssues.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {criticalIssues.length}
                </p>
              </div>
              {criticalIssues.length > 0 ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">WCAG {config.wcagLevel}</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.wcagCompliance[config.wcagLevel])}`}>
                  {Math.round(metrics.wcagCompliance[config.wcagLevel])}%
                </p>
              </div>
              <Target className={`w-8 h-8 ${getScoreColor(metrics.wcagCompliance[config.wcagLevel])}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cobertura Automatizada</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(metrics.automatedCoverage)}%
                </p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="issues">Problemas</TabsTrigger>
          <TabsTrigger value="wcag">WCAG</TabsTrigger>
          <TabsTrigger value="profile">Perfil do Usuário</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Pontuação por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* WCAG Compliance */}
            <Card>
              <CardHeader>
                <CardTitle>Conformidade WCAG</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wcagData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Conformidade']} />
                      <Bar dataKey="compliance" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issues Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Problemas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrics.issueCount.critical}</div>
                  <div className="text-sm text-gray-600">Críticos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{metrics.issueCount.serious}</div>
                  <div className="text-sm text-gray-600">Sérios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{metrics.issueCount.moderate}</div>
                  <div className="text-sm text-gray-600">Moderados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics.issueCount.minor}</div>
                  <div className="text-sm text-gray-600">Menores</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <div className="space-y-4">
            {unfixedIssues.map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(issue.type)}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{issue.description}</h3>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <Badge variant="outline">
                            WCAG {issue.wcagLevel}
                          </Badge>
                          {issue.automated && (
                            <Badge variant="secondary">
                              <Zap className="w-3 h-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{issue.wcagCriterion}</p>
                        <p className="text-sm">{issue.impact}</p>
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-blue-800">Solução:</p>
                          <p className="text-sm text-blue-700">{issue.solution}</p>
                        </div>
                        <p className="text-xs text-gray-500">Elemento: {issue.element}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => fixIssue(issue.id)}
                      size="sm"
                      variant={issue.automated ? 'default' : 'outline'}
                    >
                      {issue.automated ? 'Corrigir' : 'Marcar como Corrigido'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wcag" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['A', 'AA', 'AAA'].map((level) => (
              <Card key={level}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    WCAG {level}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(metrics.wcagCompliance[level as keyof typeof metrics.wcagCompliance])}`}>
                      {Math.round(metrics.wcagCompliance[level as keyof typeof metrics.wcagCompliance])}%
                    </div>
                    <div className="text-sm text-gray-600">Conformidade</div>
                  </div>
                  <Progress 
                    value={metrics.wcagCompliance[level as keyof typeof metrics.wcagCompliance]} 
                    className="h-2" 
                  />
                  <div className="text-sm text-gray-600">
                    {level === 'A' && 'Nível básico de acessibilidade'}
                    {level === 'AA' && 'Nível padrão recomendado'}
                    {level === 'AAA' && 'Nível mais alto de acessibilidade'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil de Acessibilidade do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Preferências de Acessibilidade</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span>Alto Contraste</span>
                    </div>
                    <Switch
                      checked={userProfile.preferences.highContrast}
                      onCheckedChange={(checked) =>
                        setUserProfile(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, highContrast: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      <span>Texto Grande</span>
                    </div>
                    <Switch
                      checked={userProfile.preferences.largeText}
                      onCheckedChange={(checked) =>
                        setUserProfile(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, largeText: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4" />
                      <span>Movimento Reduzido</span>
                    </div>
                    <Switch
                      checked={userProfile.preferences.reducedMotion}
                      onCheckedChange={(checked) =>
                        setUserProfile(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, reducedMotion: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      <span>Leitor de Tela</span>
                    </div>
                    <Switch
                      checked={userProfile.preferences.screenReader}
                      onCheckedChange={(checked) =>
                        setUserProfile(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, screenReader: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Análise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Correção Automática</label>
                  <p className="text-sm text-gray-600">Corrigir problemas automaticamente quando possível</p>
                </div>
                <Switch
                  checked={config.autoFix}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, autoFix: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nível WCAG Alvo</label>
                <Select
                  value={config.wcagLevel}
                  onValueChange={(value: 'A' | 'AA' | 'AAA') =>
                    setConfig(prev => ({ ...prev, wcagLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">WCAG A</SelectItem>
                    <SelectItem value="AA">WCAG AA</SelectItem>
                    <SelectItem value="AAA">WCAG AAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Categorias de Análise</h4>
                <div className="space-y-3">
                  {Object.entries(config.includeCategories).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(key)}
                        <label className="text-sm font-medium capitalize">
                          {key === 'visual' && 'Visual'}
                          {key === 'auditory' && 'Auditivo'}
                          {key === 'motor' && 'Motor'}
                          {key === 'cognitive' && 'Cognitivo'}
                        </label>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setConfig(prev => ({
                            ...prev,
                            includeCategories: { ...prev.includeCategories, [key]: checked }
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Configurações Específicas</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Razão de Contraste Mínima</label>
                    <Slider
                      value={[config.colorContrast.ratio]}
                      onValueChange={([value]) =>
                        setConfig(prev => ({
                          ...prev,
                          colorContrast: { ...prev.colorContrast, ratio: value }
                        }))
                      }
                      min={3}
                      max={7}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600">{config.colorContrast.ratio.toFixed(1)}:1</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tamanho Mínimo da Fonte (px)</label>
                    <Slider
                      value={[config.fontSize.minSize]}
                      onValueChange={([value]) =>
                        setConfig(prev => ({
                          ...prev,
                          fontSize: { ...prev.fontSize, minSize: value }
                        }))
                      }
                      min={12}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600">{config.fontSize.minSize}px</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccessibilityAnalyzer;