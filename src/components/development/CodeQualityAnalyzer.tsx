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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  ScatterChart,
  Scatter,
  TreeMap,
} from 'recharts';
import {
  Code,
  Bug,
  Shield,
  Zap,
  FileText,
  GitBranch,
  Users,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Download,
  RefreshCw,
  Play,
  Pause,
  Search,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  Package,
  Database,
  Globe,
  Terminal,
  FileCode,
  Folder,
  Star,
  Eye,
  GitCommit,
  Calendar,
  Hash,
} from 'lucide-react';

// Interfaces para análise de qualidade de código
interface CodeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: 'complexity' | 'maintainability' | 'reliability' | 'security' | 'performance' | 'coverage';
  threshold: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  trend: 'up' | 'down' | 'stable';
  description: string;
  timestamp: Date;
}

interface CodeIssue {
  id: string;
  type: 'bug' | 'vulnerability' | 'code_smell' | 'duplication' | 'complexity';
  severity: 'blocker' | 'critical' | 'major' | 'minor' | 'info';
  title: string;
  description: string;
  file: string;
  line: number;
  rule: string;
  effort: string;
  debt: string;
  tags: string[];
  assignee?: string;
  status: 'open' | 'confirmed' | 'resolved' | 'false_positive';
  createdAt: Date;
  updatedAt: Date;
}

interface FileAnalysis {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  lines: number;
  complexity: number;
  coverage: number;
  duplications: number;
  issues: number;
  maintainabilityIndex: number;
  lastModified: Date;
  author: string;
  language: string;
}

interface DependencyAnalysis {
  id: string;
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
  size: number;
  vulnerabilities: number;
  outdated: boolean;
  license: string;
  usage: number;
  impact: 'high' | 'medium' | 'low';
  alternatives?: string[];
}

interface QualityGate {
  id: string;
  name: string;
  conditions: {
    metric: string;
    operator: 'GT' | 'LT' | 'EQ';
    threshold: number;
    status: 'passed' | 'failed' | 'warning';
  }[];
  status: 'passed' | 'failed' | 'warning';
  lastExecution: Date;
}

interface TeamMetrics {
  developer: string;
  commits: number;
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
  bugsIntroduced: number;
  bugsFixed: number;
  codeReviews: number;
  productivity: number;
  quality: number;
}

interface TechnicalDebt {
  id: string;
  category: 'code_smell' | 'duplication' | 'complexity' | 'coverage' | 'documentation';
  description: string;
  effort: number; // em horas
  impact: 'high' | 'medium' | 'low';
  priority: number;
  files: string[];
  estimatedCost: number;
  remediation: string;
}

const CodeQualityAnalyzer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<CodeMetric[]>([]);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [files, setFiles] = useState<FileAnalysis[]>([]);
  const [dependencies, setDependencies] = useState<DependencyAnalysis[]>([]);
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics[]>([]);
  const [technicalDebt, setTechnicalDebt] = useState<TechnicalDebt[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoAnalysis, setAutoAnalysis] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // Simular dados de análise de qualidade
  useEffect(() => {
    if (isAnalyzing) {
      const mockMetrics: CodeMetric[] = [
        {
          id: 'complexity',
          name: 'Complexidade Ciclomática',
          value: 8.5,
          unit: '',
          category: 'complexity',
          threshold: { excellent: 5, good: 10, fair: 15, poor: 20 },
          trend: 'up',
          description: 'Complexidade média dos métodos',
          timestamp: new Date(),
        },
        {
          id: 'coverage',
          name: 'Cobertura de Testes',
          value: 78.5,
          unit: '%',
          category: 'coverage',
          threshold: { excellent: 90, good: 80, fair: 70, poor: 60 },
          trend: 'down',
          description: 'Percentual de código coberto por testes',
          timestamp: new Date(),
        },
        {
          id: 'duplication',
          name: 'Duplicação de Código',
          value: 5.2,
          unit: '%',
          category: 'maintainability',
          threshold: { excellent: 3, good: 5, fair: 10, poor: 15 },
          trend: 'stable',
          description: 'Percentual de código duplicado',
          timestamp: new Date(),
        },
        {
          id: 'vulnerabilities',
          name: 'Vulnerabilidades',
          value: 3,
          unit: '',
          category: 'security',
          threshold: { excellent: 0, good: 2, fair: 5, poor: 10 },
          trend: 'down',
          description: 'Número de vulnerabilidades de segurança',
          timestamp: new Date(),
        },
        {
          id: 'maintainability',
          name: 'Índice de Manutenibilidade',
          value: 72,
          unit: '',
          category: 'maintainability',
          threshold: { excellent: 85, good: 70, fair: 50, poor: 30 },
          trend: 'up',
          description: 'Facilidade de manutenção do código',
          timestamp: new Date(),
        },
        {
          id: 'debt',
          name: 'Débito Técnico',
          value: 2.5,
          unit: 'dias',
          category: 'maintainability',
          threshold: { excellent: 1, good: 3, fair: 7, poor: 14 },
          trend: 'stable',
          description: 'Tempo estimado para resolver problemas',
          timestamp: new Date(),
        },
      ];

      const mockIssues: CodeIssue[] = [
        {
          id: '1',
          type: 'bug',
          severity: 'major',
          title: 'Possível NullPointerException',
          description: 'Variável pode ser nula antes do uso',
          file: 'src/components/UserProfile.tsx',
          line: 45,
          rule: 'typescript:S2259',
          effort: '10min',
          debt: '10min',
          tags: ['typescript', 'null-safety'],
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          type: 'vulnerability',
          severity: 'critical',
          title: 'Dependência com vulnerabilidade conhecida',
          description: 'Versão do lodash contém vulnerabilidade CVE-2021-23337',
          file: 'package.json',
          line: 15,
          rule: 'security:S5852',
          effort: '30min',
          debt: '30min',
          tags: ['security', 'dependencies'],
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          type: 'code_smell',
          severity: 'minor',
          title: 'Função muito longa',
          description: 'Função com mais de 50 linhas deve ser refatorada',
          file: 'src/utils/dataProcessor.ts',
          line: 120,
          rule: 'typescript:S138',
          effort: '1h',
          debt: '1h',
          tags: ['maintainability', 'refactoring'],
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          type: 'duplication',
          severity: 'major',
          title: 'Código duplicado detectado',
          description: 'Bloco de código duplicado em 3 arquivos',
          file: 'src/components/Modal.tsx',
          line: 25,
          rule: 'common-ts:DuplicatedBlocks',
          effort: '45min',
          debt: '45min',
          tags: ['duplication', 'refactoring'],
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFiles: FileAnalysis[] = [
        {
          id: '1',
          path: 'src/components/UserProfile.tsx',
          name: 'UserProfile.tsx',
          extension: 'tsx',
          size: 15420,
          lines: 450,
          complexity: 12,
          coverage: 85,
          duplications: 2,
          issues: 3,
          maintainabilityIndex: 68,
          lastModified: new Date(),
          author: 'João Silva',
          language: 'TypeScript',
        },
        {
          id: '2',
          path: 'src/utils/dataProcessor.ts',
          name: 'dataProcessor.ts',
          extension: 'ts',
          size: 8950,
          lines: 280,
          complexity: 18,
          coverage: 92,
          duplications: 0,
          issues: 1,
          maintainabilityIndex: 72,
          lastModified: new Date(),
          author: 'Maria Santos',
          language: 'TypeScript',
        },
        {
          id: '3',
          path: 'src/components/Modal.tsx',
          name: 'Modal.tsx',
          extension: 'tsx',
          size: 6780,
          lines: 195,
          complexity: 8,
          coverage: 75,
          duplications: 5,
          issues: 2,
          maintainabilityIndex: 65,
          lastModified: new Date(),
          author: 'Pedro Costa',
          language: 'TypeScript',
        },
      ];

      const mockDependencies: DependencyAnalysis[] = [
        {
          id: '1',
          name: 'react',
          version: '18.2.0',
          type: 'production',
          size: 2500,
          vulnerabilities: 0,
          outdated: false,
          license: 'MIT',
          usage: 95,
          impact: 'high',
        },
        {
          id: '2',
          name: 'lodash',
          version: '4.17.20',
          type: 'production',
          size: 1200,
          vulnerabilities: 1,
          outdated: true,
          license: 'MIT',
          usage: 45,
          impact: 'medium',
          alternatives: ['ramda', 'native-methods'],
        },
        {
          id: '3',
          name: 'axios',
          version: '1.4.0',
          type: 'production',
          size: 800,
          vulnerabilities: 0,
          outdated: false,
          license: 'MIT',
          usage: 80,
          impact: 'high',
        },
      ];

      const mockQualityGates: QualityGate[] = [
        {
          id: '1',
          name: 'Portão Principal',
          conditions: [
            { metric: 'coverage', operator: 'GT', threshold: 80, status: 'failed' },
            { metric: 'duplications', operator: 'LT', threshold: 5, status: 'passed' },
            { metric: 'vulnerabilities', operator: 'EQ', threshold: 0, status: 'failed' },
            { metric: 'maintainability', operator: 'GT', threshold: 70, status: 'passed' },
          ],
          status: 'failed',
          lastExecution: new Date(),
        },
      ];

      const mockTeamMetrics: TeamMetrics[] = [
        {
          developer: 'João Silva',
          commits: 45,
          linesAdded: 2850,
          linesRemoved: 1200,
          filesChanged: 85,
          bugsIntroduced: 3,
          bugsFixed: 8,
          codeReviews: 12,
          productivity: 85,
          quality: 78,
        },
        {
          developer: 'Maria Santos',
          commits: 38,
          linesAdded: 3200,
          linesRemoved: 950,
          filesChanged: 72,
          bugsIntroduced: 2,
          bugsFixed: 15,
          codeReviews: 18,
          productivity: 92,
          quality: 88,
        },
        {
          developer: 'Pedro Costa',
          commits: 52,
          linesAdded: 2100,
          linesRemoved: 1800,
          filesChanged: 95,
          bugsIntroduced: 5,
          bugsFixed: 6,
          codeReviews: 8,
          productivity: 75,
          quality: 65,
        },
      ];

      const mockTechnicalDebt: TechnicalDebt[] = [
        {
          id: '1',
          category: 'code_smell',
          description: 'Refatorar funções muito longas',
          effort: 8,
          impact: 'medium',
          priority: 7,
          files: ['src/utils/dataProcessor.ts', 'src/components/UserProfile.tsx'],
          estimatedCost: 2400,
          remediation: 'Quebrar funções em métodos menores e mais específicos',
        },
        {
          id: '2',
          category: 'duplication',
          description: 'Eliminar código duplicado',
          effort: 12,
          impact: 'high',
          priority: 9,
          files: ['src/components/Modal.tsx', 'src/components/Dialog.tsx'],
          estimatedCost: 3600,
          remediation: 'Criar componente base reutilizável',
        },
        {
          id: '3',
          category: 'coverage',
          description: 'Aumentar cobertura de testes',
          effort: 16,
          impact: 'high',
          priority: 8,
          files: ['src/services/', 'src/utils/'],
          estimatedCost: 4800,
          remediation: 'Escrever testes unitários para módulos não cobertos',
        },
      ];

      setMetrics(mockMetrics);
      setIssues(mockIssues);
      setFiles(mockFiles);
      setDependencies(mockDependencies);
      setQualityGates(mockQualityGates);
      setTeamMetrics(mockTeamMetrics);
      setTechnicalDebt(mockTechnicalDebt);
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  // Handlers
  const startAnalysis = () => {
    setIsAnalyzing(true);
  };

  const resolveIssue = (issueId: string) => {
    setIssues(prev =>
      prev.map(issue => issue.id === issueId ? { ...issue, status: 'resolved' } : issue)
    );
  };

  const markFalsePositive = (issueId: string) => {
    setIssues(prev =>
      prev.map(issue => issue.id === issueId ? { ...issue, status: 'false_positive' } : issue)
    );
  };

  const updateDependency = (depId: string) => {
    setDependencies(prev =>
      prev.map(dep => dep.id === depId ? { ...dep, outdated: false, vulnerabilities: 0 } : dep)
    );
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      issues: issues.filter(i => i.status === 'open'),
      files,
      dependencies,
      qualityGates,
      teamMetrics,
      technicalDebt,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-quality-report-${Date.now()}.json`;
    a.click();
  };

  // Valores computados
  const overallQualityScore = useMemo(() => {
    if (metrics.length === 0) return 0;
    
    const scores = metrics.map(metric => {
      const { value, threshold } = metric;
      if (value <= threshold.excellent) return 100;
      if (value <= threshold.good) return 85;
      if (value <= threshold.fair) return 70;
      return 50;
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [metrics]);

  const criticalIssues = useMemo(() => 
    issues.filter(i => i.severity === 'critical' && i.status === 'open'), [issues]
  );
  
  const blockerIssues = useMemo(() => 
    issues.filter(i => i.severity === 'blocker' && i.status === 'open'), [issues]
  );
  
  const vulnerabilities = useMemo(() => 
    issues.filter(i => i.type === 'vulnerability' && i.status === 'open'), [issues]
  );
  
  const totalTechnicalDebt = useMemo(() => 
    technicalDebt.reduce((sum, debt) => sum + debt.effort, 0), [technicalDebt]
  );

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
      const matchesType = selectedType === 'all' || issue.type === selectedType;
      const matchesSearch = searchTerm === '' || 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.file.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSeverity && matchesType && matchesSearch && issue.status === 'open';
    });
  }, [issues, selectedSeverity, selectedType, searchTerm]);

  const getQualityScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricStatus = (metric: CodeMetric) => {
    const { value, threshold } = metric;
    if (value <= threshold.excellent) return 'excellent';
    if (value <= threshold.good) return 'good';
    if (value <= threshold.fair) return 'fair';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'blocker': return 'bg-red-600 text-white';
      case 'critical': return 'bg-red-500 text-white';
      case 'major': return 'bg-orange-500 text-white';
      case 'minor': return 'bg-yellow-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'vulnerability': return <Shield className="w-4 h-4" />;
      case 'code_smell': return <Code className="w-4 h-4" />;
      case 'duplication': return <FileText className="w-4 h-4" />;
      case 'complexity': return <Activity className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'complexity': return <Activity className="w-4 h-4" />;
      case 'maintainability': return <Settings className="w-4 h-4" />;
      case 'reliability': return <Shield className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'coverage': return <Target className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4" />;
    }
  };

  // Dados para gráficos
  const qualityTrendData = [
    { date: '2024-01-01', quality: 68, coverage: 75, complexity: 8.2, debt: 3.2 },
    { date: '2024-01-08', quality: 70, coverage: 76, complexity: 8.0, debt: 3.0 },
    { date: '2024-01-15', quality: 69, coverage: 77, complexity: 8.3, debt: 3.1 },
    { date: '2024-01-22', quality: 72, coverage: 78, complexity: 8.1, debt: 2.8 },
    { date: '2024-01-29', quality: 72, coverage: 78.5, complexity: 8.5, debt: 2.5 },
  ];

  const issueDistributionData = [
    { name: 'Bugs', value: issues.filter(i => i.type === 'bug').length, color: '#ef4444' },
    { name: 'Vulnerabilidades', value: issues.filter(i => i.type === 'vulnerability').length, color: '#dc2626' },
    { name: 'Code Smells', value: issues.filter(i => i.type === 'code_smell').length, color: '#f59e0b' },
    { name: 'Duplicação', value: issues.filter(i => i.type === 'duplication').length, color: '#3b82f6' },
    { name: 'Complexidade', value: issues.filter(i => i.type === 'complexity').length, color: '#8b5cf6' },
  ];

  const teamProductivityData = teamMetrics.map(member => ({
    name: member.developer.split(' ')[0],
    productivity: member.productivity,
    quality: member.quality,
    commits: member.commits,
    reviews: member.codeReviews,
  }));

  const fileComplexityData = files.map(file => ({
    name: file.name,
    complexity: file.complexity,
    lines: file.lines,
    issues: file.issues,
    coverage: file.coverage,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analisador de Qualidade de Código</h1>
          <p className="text-gray-600 mt-1">
            Monitore métricas de qualidade, identifique problemas e gerencie débito técnico
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoAnalysis}
              onCheckedChange={setAutoAnalysis}
            />
            <span className="text-sm">Análise Automática</span>
          </div>
          <Button
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isAnalyzing ? 'Analisando...' : 'Iniciar Análise'}
          </Button>
          <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Qualidade Geral</p>
                <p className={`text-2xl font-bold ${getQualityScoreColor(overallQualityScore)}`}>
                  {overallQualityScore}
                </p>
              </div>
              <Target className={`w-8 h-8 ${getQualityScoreColor(overallQualityScore)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bloqueadores</p>
                <p className={`text-2xl font-bold ${blockerIssues.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {blockerIssues.length}
                </p>
              </div>
              <XCircle className={`w-8 h-8 ${blockerIssues.length > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vulnerabilidades</p>
                <p className={`text-2xl font-bold ${vulnerabilities.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {vulnerabilities.length}
                </p>
              </div>
              <Shield className={`w-8 h-8 ${vulnerabilities.length > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cobertura</p>
                <p className={`text-2xl font-bold ${metrics.find(m => m.id === 'coverage')?.value || 0 >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.find(m => m.id === 'coverage')?.value || 0}%
                </p>
              </div>
              <Target className={`w-8 h-8 ${metrics.find(m => m.id === 'coverage')?.value || 0 >= 80 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Débito Técnico</p>
                <p className={`text-2xl font-bold ${totalTechnicalDebt > 40 ? 'text-red-600' : totalTechnicalDebt > 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {totalTechnicalDebt}h
                </p>
              </div>
              <Clock className={`w-8 h-8 ${totalTechnicalDebt > 40 ? 'text-red-600' : totalTechnicalDebt > 20 ? 'text-yellow-600' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Gates */}
      {qualityGates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portões de Qualidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityGates.map((gate) => (
                <div key={gate.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{gate.name}</h3>
                    <Badge variant={gate.status === 'passed' ? 'default' : 'destructive'}>
                      {gate.status === 'passed' ? 'Aprovado' : 'Reprovado'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {gate.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {condition.status === 'passed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {condition.metric} {condition.operator} {condition.threshold}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="issues">Problemas</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="dependencies">Dependências</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="debt">Débito Técnico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Qualidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={qualityTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="quality" stroke="#3b82f6" name="Qualidade" />
                      <Line type="monotone" dataKey="coverage" stroke="#10b981" name="Cobertura" />
                      <Line type="monotone" dataKey="complexity" stroke="#f59e0b" name="Complexidade" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Issue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Problemas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={issueDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {issueDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Productivity */}
          <Card>
            <CardHeader>
              <CardTitle>Produtividade da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="productivity" fill="#3b82f6" name="Produtividade" />
                    <Bar dataKey="quality" fill="#10b981" name="Qualidade" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const status = getMetricStatus(metric);
              return (
                <Card key={metric.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(metric.category)}
                        <h3 className="font-medium text-sm">{metric.name}</h3>
                      </div>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{metric.value}</span>
                        <span className="text-sm text-gray-600">{metric.unit}</span>
                      </div>
                      <Badge className={getStatusColor(status)}>
                        {status === 'excellent' && 'Excelente'}
                        {status === 'good' && 'Bom'}
                        {status === 'fair' && 'Regular'}
                        {status === 'poor' && 'Ruim'}
                      </Badge>
                      <p className="text-xs text-gray-500">{metric.description}</p>
                      <div className="text-xs text-gray-500">
                        Meta: {metric.threshold.good}{metric.unit}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="Buscar problemas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="blocker">Bloqueador</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="major">Maior</SelectItem>
                    <SelectItem value="minor">Menor</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="vulnerability">Vulnerabilidade</SelectItem>
                    <SelectItem value="code_smell">Code Smell</SelectItem>
                    <SelectItem value="duplication">Duplicação</SelectItem>
                    <SelectItem value="complexity">Complexidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(issue.type)}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{issue.title}</h3>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <Badge variant="outline">{issue.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{issue.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileCode className="w-3 h-3" />
                            {issue.file}:{issue.line}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {issue.effort}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {issue.rule}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {issue.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => resolveIssue(issue.id)}
                        size="sm"
                        variant="outline"
                      >
                        Resolver
                      </Button>
                      <Button
                        onClick={() => markFalsePositive(issue.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Falso Positivo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="space-y-4">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5" />
                      <div>
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-gray-600">{file.path}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{file.lines} linhas</span>
                          <span>{(file.size / 1024).toFixed(1)}KB</span>
                          <span>Complexidade: {file.complexity}</span>
                          <span>Cobertura: {file.coverage}%</span>
                          <span>{file.issues} problemas</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Índice de Manutenibilidade</p>
                        <p className={`text-lg font-bold ${
                          file.maintainabilityIndex >= 80 ? 'text-green-600' :
                          file.maintainabilityIndex >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {file.maintainabilityIndex}
                        </p>
                      </div>
                      <Progress 
                        value={file.maintainabilityIndex} 
                        className="w-20" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-6">
          <div className="space-y-4">
            {dependencies.map((dep) => (
              <Card key={dep.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5" />
                      <div>
                        <h3 className="font-medium">{dep.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>v{dep.version}</span>
                          <span>{(dep.size / 1024).toFixed(1)}MB</span>
                          <span>{dep.license}</span>
                          <Badge variant={dep.type === 'production' ? 'default' : 'secondary'}>
                            {dep.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {dep.outdated && <Badge variant="destructive">Desatualizada</Badge>}
                          {dep.vulnerabilities > 0 && (
                            <Badge variant="destructive">
                              {dep.vulnerabilities} vulnerabilidades
                            </Badge>
                          )}
                          <Badge variant={dep.impact === 'high' ? 'destructive' : dep.impact === 'medium' ? 'default' : 'secondary'}>
                            Impacto: {dep.impact}
                          </Badge>
                        </div>
                        {dep.alternatives && dep.alternatives.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Alternativas:</p>
                            <div className="flex gap-1">
                              {dep.alternatives.map((alt) => (
                                <Badge key={alt} variant="outline" className="text-xs">
                                  {alt}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Uso</p>
                        <p className="text-lg font-bold">{dep.usage}%</p>
                      </div>
                      {(dep.outdated || dep.vulnerabilities > 0) && (
                        <Button
                          onClick={() => updateDependency(dep.id)}
                          size="sm"
                          variant="outline"
                        >
                          Atualizar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="space-y-4">
            {teamMetrics.map((member) => (
              <Card key={member.developer}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      <div>
                        <h3 className="font-medium">{member.developer}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
                          <div>
                            <p className="text-xs text-gray-500">Commits</p>
                            <p className="font-medium">{member.commits}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Linhas +/-</p>
                            <p className="font-medium text-green-600">+{member.linesAdded}</p>
                            <p className="font-medium text-red-600">-{member.linesRemoved}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Bugs</p>
                            <p className="font-medium text-red-600">+{member.bugsIntroduced}</p>
                            <p className="font-medium text-green-600">-{member.bugsFixed}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Code Reviews</p>
                            <p className="font-medium">{member.codeReviews}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Produtividade</p>
                        <p className={`text-lg font-bold ${
                          member.productivity >= 85 ? 'text-green-600' :
                          member.productivity >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {member.productivity}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Qualidade</p>
                        <p className={`text-lg font-bold ${
                          member.quality >= 85 ? 'text-green-600' :
                          member.quality >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {member.quality}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="debt" className="space-y-6">
          <div className="space-y-4">
            {technicalDebt.map((debt) => (
              <Card key={debt.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 mt-1" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{debt.description}</h3>
                          <Badge variant={debt.impact === 'high' ? 'destructive' : debt.impact === 'medium' ? 'default' : 'secondary'}>
                            {debt.impact}
                          </Badge>
                          <Badge variant="outline">Prioridade: {debt.priority}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{debt.effort}h de esforço</span>
                          <span>R$ {debt.estimatedCost.toLocaleString()}</span>
                          <span>{debt.files.length} arquivos</span>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-blue-800">Remediação:</p>
                          <p className="text-sm text-blue-700">{debt.remediation}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Arquivos afetados:</p>
                          {debt.files.map((file) => (
                            <Badge key={file} variant="outline" className="text-xs mr-1">
                              {file}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Esforço</p>
                      <p className="text-2xl font-bold text-orange-600">{debt.effort}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CodeQualityAnalyzer;