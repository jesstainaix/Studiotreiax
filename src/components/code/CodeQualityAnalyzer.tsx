import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  TreeMap
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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  Settings,
  Filter,
  Search,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Award,
  Layers
} from 'lucide-react';

// Interfaces
interface CodeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
  target?: number;
  description: string;
}

interface CodeIssue {
  id: string;
  type: 'bug' | 'vulnerability' | 'code_smell' | 'duplication' | 'complexity';
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
  title: string;
  description: string;
  file: string;
  line: number;
  rule: string;
  effort: string;
  tags: string[];
  assignee?: string;
  status: 'open' | 'confirmed' | 'resolved' | 'false_positive';
  createdAt: Date;
  updatedAt: Date;
}

interface CodeCoverage {
  id: string;
  file: string;
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}

interface CodeComplexity {
  id: string;
  file: string;
  function: string;
  complexity: number;
  lines: number;
  parameters: number;
  maintainabilityIndex: number;
  cognitiveComplexity: number;
}

interface CodeDuplication {
  id: string;
  files: string[];
  lines: number;
  tokens: number;
  percentage: number;
  blocks: Array<{
    file: string;
    startLine: number;
    endLine: number;
  }>;
}

interface CodeReview {
  id: string;
  title: string;
  author: string;
  reviewer: string;
  status: 'pending' | 'approved' | 'changes_requested' | 'merged';
  files: number;
  additions: number;
  deletions: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
  branch: string;
}

interface QualityGate {
  id: string;
  name: string;
  conditions: Array<{
    metric: string;
    operator: 'greater' | 'less' | 'equal';
    value: number;
    status: 'passed' | 'failed' | 'warning';
  }>;
  status: 'passed' | 'failed' | 'warning';
  lastRun: Date;
}

interface AnalysisConfig {
  enabled: boolean;
  schedule: 'manual' | 'on_commit' | 'daily' | 'weekly';
  rules: {
    bugs: boolean;
    vulnerabilities: boolean;
    codeSmells: boolean;
    duplication: boolean;
    coverage: boolean;
    complexity: boolean;
  };
  thresholds: {
    coverage: number;
    duplication: number;
    complexity: number;
    maintainability: number;
  };
  notifications: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    events: ('new_issues' | 'quality_gate' | 'coverage_drop')[];
  };
}

const CodeQualityAnalyzer: React.FC = () => {
  // Estados
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState<CodeMetric[]>([]);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [coverage, setCoverage] = useState<CodeCoverage[]>([]);
  const [complexity, setComplexity] = useState<CodeComplexity[]>([]);
  const [duplication, setDuplication] = useState<CodeDuplication[]>([]);
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);
  const [config, setConfig] = useState<AnalysisConfig>(defaultConfig);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados simulados
  useEffect(() => {
    setMetrics(mockMetrics);
    setIssues(mockIssues);
    setCoverage(mockCoverage);
    setComplexity(mockComplexity);
    setDuplication(mockDuplication);
    setReviews(mockReviews);
    setQualityGates(mockQualityGates);
  }, []);

  // Handlers
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    // Simular análise
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsAnalyzing(false);
  };

  const handleExportReport = (format: 'pdf' | 'html' | 'json') => {
  };

  const handleUpdateConfig = (newConfig: Partial<AnalysisConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': case 'passed': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'excellent': case 'passed': return 'bg-green-100';
      case 'good': return 'bg-blue-100';
      case 'warning': return 'bg-yellow-100';
      case 'critical': case 'failed': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'blocker': case 'critical': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'major': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'minor': return <Eye className="w-4 h-4 text-yellow-600" />;
      default: return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'vulnerability': return <Shield className="w-4 h-4" />;
      case 'code_smell': return <Code className="w-4 h-4" />;
      case 'duplication': return <Layers className="w-4 h-4" />;
      case 'complexity': return <BarChart3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Valores computados
  const overallScore = Math.round(metrics.reduce((sum, metric) => {
    const score = metric.status === 'excellent' ? 100 : 
                 metric.status === 'good' ? 75 : 
                 metric.status === 'warning' ? 50 : 25;
    return sum + score;
  }, 0) / metrics.length);

  const totalIssues = issues.length;
  const criticalIssues = issues.filter(issue => issue.severity === 'critical' || issue.severity === 'blocker').length;
  const overallCoverage = coverage.length > 0 ? 
    Math.round(coverage.reduce((sum, c) => sum + c.lines.percentage, 0) / coverage.length) : 0;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'issues', label: 'Issues', icon: Bug },
    { id: 'coverage', label: 'Cobertura', icon: Target },
    { id: 'complexity', label: 'Complexidade', icon: Activity },
    { id: 'duplication', label: 'Duplicação', icon: Layers },
    { id: 'reviews', label: 'Reviews', icon: Users },
    { id: 'quality-gates', label: 'Quality Gates', icon: Award },
    { id: 'config', label: 'Configurações', icon: Settings }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise de Qualidade de Código</h1>
          <p className="text-gray-600 mt-1">Monitore e melhore a qualidade do seu código</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analisando...' : 'Iniciar Análise'}</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExportReport('pdf')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Score Geral</p>
              <p className="text-2xl font-bold text-gray-900">{overallScore}</p>
            </div>
            <div className={`p-3 rounded-full ${getStatusBg(overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : 'warning')}`}>
              <Award className={`w-6 h-6 ${getStatusColor(overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : 'warning')}`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              {getTrendIcon('up')}
              <span className="text-sm text-gray-600">+5% esta semana</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Issues</p>
              <p className="text-2xl font-bold text-gray-900">{totalIssues}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Bug className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-red-600">{criticalIssues} críticas</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cobertura</p>
              <p className="text-2xl font-bold text-gray-900">{overallCoverage}%</p>
            </div>
            <div className={`p-3 rounded-full ${getStatusBg(overallCoverage >= 80 ? 'excellent' : overallCoverage >= 60 ? 'good' : 'warning')}`}>
              <Target className={`w-6 h-6 ${getStatusColor(overallCoverage >= 80 ? 'excellent' : overallCoverage >= 60 ? 'good' : 'warning')}`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              {getTrendIcon('up')}
              <span className="text-sm text-gray-600">+3% este mês</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quality Gates</p>
              <p className="text-2xl font-bold text-gray-900">{qualityGates.filter(qg => qg.status === 'passed').length}/{qualityGates.length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-600">Todos passando</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Gráficos de métricas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Qualidade</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={qualityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="coverage" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Issues</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={issueDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {issueDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar de métricas */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Radar de Qualidade</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Atual"
                  dataKey="current"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Meta"
                  dataKey="target"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os tipos</option>
                <option value="bug">Bugs</option>
                <option value="vulnerability">Vulnerabilidades</option>
                <option value="code_smell">Code Smells</option>
                <option value="duplication">Duplicação</option>
                <option value="complexity">Complexidade</option>
              </select>
            </div>
          </div>

          {/* Lista de issues */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Issues Encontradas</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {issues
                .filter(issue => selectedFilter === 'all' || issue.type === selectedFilter)
                .filter(issue => searchTerm === '' || 
                  issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  issue.file.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((issue) => (
                  <div key={issue.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(issue.severity)}
                          {getTypeIcon(issue.type)}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{issue.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{issue.file}:{issue.line}</span>
                            <span>Regra: {issue.rule}</span>
                            <span>Esforço: {issue.effort}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            {issue.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          issue.severity === 'blocker' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                          issue.severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.severity}
                        </span>
                        
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          issue.status === 'open' ? 'bg-red-100 text-red-800' :
                          issue.status === 'confirmed' ? 'bg-orange-100 text-orange-800' :
                          issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coverage' && (
        <div className="space-y-6">
          {/* Gráfico de cobertura */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cobertura por Arquivo</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={coverage.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="file" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lines.percentage" fill="#3B82F6" name="Linhas" />
                <Bar dataKey="branches.percentage" fill="#10B981" name="Branches" />
                <Bar dataKey="functions.percentage" fill="#F59E0B" name="Funções" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela detalhada */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes de Cobertura</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arquivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Linhas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funções
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statements
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coverage.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {file.file}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{file.lines.percentage.toFixed(1)}%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                file.lines.percentage >= 80 ? 'bg-green-500' :
                                file.lines.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${file.lines.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{file.branches.percentage.toFixed(1)}%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                file.branches.percentage >= 80 ? 'bg-green-500' :
                                file.branches.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${file.branches.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{file.functions.percentage.toFixed(1)}%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                file.functions.percentage >= 80 ? 'bg-green-500' :
                                file.functions.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${file.functions.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{file.statements.percentage.toFixed(1)}%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                file.statements.percentage >= 80 ? 'bg-green-500' :
                                file.statements.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${file.statements.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'complexity' && (
        <div className="space-y-6">
          {/* Gráfico de complexidade */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complexidade Ciclomática</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={complexity.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="function" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="complexity" fill="#EF4444" name="Complexidade" />
                <Bar dataKey="cognitiveComplexity" fill="#F97316" name="Complexidade Cognitiva" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* TreeMap de complexidade */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Complexidade</h3>
            <ResponsiveContainer width="100%" height={400}>
              <TreeMap
                data={complexity.map(c => ({
                  name: c.function,
                  size: c.complexity,
                  fill: c.complexity > 10 ? '#EF4444' : c.complexity > 5 ? '#F97316' : '#10B981'
                }))}
                dataKey="size"
                ratio={4/3}
                stroke="#fff"
                fill="#8884d8"
              />
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Análise</h3>
            
            <div className="space-y-6">
              {/* Configurações gerais */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Geral</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700">Análise Automática</label>
                      <p className="text-sm text-gray-600">Executar análise automaticamente</p>
                    </div>
                    <button
                      onClick={() => handleUpdateConfig({ enabled: !config.enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">Agendamento</label>
                    <select
                      value={config.schedule}
                      onChange={(e) => handleUpdateConfig({ schedule: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="manual">Manual</option>
                      <option value="on_commit">A cada commit</option>
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Regras de análise */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Regras de Análise</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(config.rules).map(([rule, enabled]) => (
                    <label key={rule} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => handleUpdateConfig({
                          rules: { ...config.rules, [rule]: e.target.checked }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {rule.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Thresholds */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Limites</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cobertura Mínima (%)</label>
                    <input
                      type="number"
                      value={config.thresholds.coverage}
                      onChange={(e) => handleUpdateConfig({
                        thresholds: { ...config.thresholds, coverage: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duplicação Máxima (%)</label>
                    <input
                      type="number"
                      value={config.thresholds.duplication}
                      onChange={(e) => handleUpdateConfig({
                        thresholds: { ...config.thresholds, duplication: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complexidade Máxima</label>
                    <input
                      type="number"
                      value={config.thresholds.complexity}
                      onChange={(e) => handleUpdateConfig({
                        thresholds: { ...config.thresholds, complexity: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      min="1"
                      max="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Índice de Manutenibilidade</label>
                    <input
                      type="number"
                      value={config.thresholds.maintainability}
                      onChange={(e) => handleUpdateConfig({
                        thresholds: { ...config.thresholds, maintainability: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Configuração padrão
const defaultConfig: AnalysisConfig = {
  enabled: true,
  schedule: 'on_commit',
  rules: {
    bugs: true,
    vulnerabilities: true,
    codeSmells: true,
    duplication: true,
    coverage: true,
    complexity: true
  },
  thresholds: {
    coverage: 80,
    duplication: 3,
    complexity: 10,
    maintainability: 70
  },
  notifications: {
    enabled: true,
    channels: ['email'],
    events: ['new_issues', 'quality_gate']
  }
};

// Dados simulados
const mockMetrics: CodeMetric[] = [
  {
    id: '1',
    name: 'Cobertura de Código',
    value: 85.2,
    unit: '%',
    status: 'excellent',
    trend: 'up',
    change: 2.1,
    target: 80,
    description: 'Percentual de código coberto por testes'
  },
  {
    id: '2',
    name: 'Complexidade Ciclomática',
    value: 7.3,
    unit: '',
    status: 'good',
    trend: 'stable',
    change: 0.1,
    target: 10,
    description: 'Complexidade média das funções'
  },
  {
    id: '3',
    name: 'Duplicação de Código',
    value: 2.1,
    unit: '%',
    status: 'excellent',
    trend: 'down',
    change: -0.5,
    target: 3,
    description: 'Percentual de código duplicado'
  },
  {
    id: '4',
    name: 'Dívida Técnica',
    value: 4.2,
    unit: 'h',
    status: 'warning',
    trend: 'up',
    change: 0.8,
    description: 'Tempo estimado para resolver issues'
  }
];

const mockIssues: CodeIssue[] = [
  {
    id: '1',
    type: 'bug',
    severity: 'critical',
    title: 'Null pointer exception',
    description: 'Possível acesso a objeto nulo sem verificação',
    file: 'src/components/UserProfile.tsx',
    line: 45,
    rule: 'typescript:no-null-check',
    effort: '15min',
    tags: ['reliability', 'typescript'],
    status: 'open',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    type: 'vulnerability',
    severity: 'major',
    title: 'SQL Injection vulnerability',
    description: 'Query SQL construída sem sanitização adequada',
    file: 'src/api/users.ts',
    line: 23,
    rule: 'security:sql-injection',
    effort: '30min',
    tags: ['security', 'database'],
    status: 'confirmed',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: '3',
    type: 'code_smell',
    severity: 'minor',
    title: 'Função muito longa',
    description: 'Função com mais de 50 linhas deve ser refatorada',
    file: 'src/utils/dataProcessor.ts',
    line: 12,
    rule: 'maintainability:function-length',
    effort: '1h',
    tags: ['maintainability', 'refactoring'],
    status: 'open',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13')
  }
];

const mockCoverage: CodeCoverage[] = [
  {
    id: '1',
    file: 'src/components/UserProfile.tsx',
    lines: { total: 120, covered: 102, percentage: 85.0 },
    branches: { total: 24, covered: 20, percentage: 83.3 },
    functions: { total: 8, covered: 7, percentage: 87.5 },
    statements: { total: 95, covered: 82, percentage: 86.3 }
  },
  {
    id: '2',
    file: 'src/api/users.ts',
    lines: { total: 85, covered: 68, percentage: 80.0 },
    branches: { total: 16, covered: 12, percentage: 75.0 },
    functions: { total: 6, covered: 5, percentage: 83.3 },
    statements: { total: 72, covered: 58, percentage: 80.6 }
  },
  {
    id: '3',
    file: 'src/utils/dataProcessor.ts',
    lines: { total: 200, covered: 150, percentage: 75.0 },
    branches: { total: 40, covered: 28, percentage: 70.0 },
    functions: { total: 12, covered: 9, percentage: 75.0 },
    statements: { total: 180, covered: 135, percentage: 75.0 }
  }
];

const mockComplexity: CodeComplexity[] = [
  {
    id: '1',
    file: 'src/components/UserProfile.tsx',
    function: 'validateUserData',
    complexity: 12,
    lines: 45,
    parameters: 3,
    maintainabilityIndex: 65,
    cognitiveComplexity: 8
  },
  {
    id: '2',
    file: 'src/api/users.ts',
    function: 'processUserQuery',
    complexity: 8,
    lines: 32,
    parameters: 2,
    maintainabilityIndex: 72,
    cognitiveComplexity: 6
  },
  {
    id: '3',
    file: 'src/utils/dataProcessor.ts',
    function: 'transformData',
    complexity: 15,
    lines: 68,
    parameters: 4,
    maintainabilityIndex: 58,
    cognitiveComplexity: 12
  }
];

const mockDuplication: CodeDuplication[] = [
  {
    id: '1',
    files: ['src/components/UserProfile.tsx', 'src/components/AdminProfile.tsx'],
    lines: 25,
    tokens: 150,
    percentage: 2.1,
    blocks: [
      { file: 'src/components/UserProfile.tsx', startLine: 45, endLine: 70 },
      { file: 'src/components/AdminProfile.tsx', startLine: 32, endLine: 57 }
    ]
  }
];

const mockReviews: CodeReview[] = [
  {
    id: '1',
    title: 'Implementar autenticação JWT',
    author: 'João Silva',
    reviewer: 'Maria Santos',
    status: 'approved',
    files: 5,
    additions: 120,
    deletions: 45,
    comments: 3,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    branch: 'feature/jwt-auth'
  }
];

const mockQualityGates: QualityGate[] = [
  {
    id: '1',
    name: 'Quality Gate Principal',
    conditions: [
      { metric: 'coverage', operator: 'greater', value: 80, status: 'passed' },
      { metric: 'duplication', operator: 'less', value: 3, status: 'passed' },
      { metric: 'complexity', operator: 'less', value: 10, status: 'warning' }
    ],
    status: 'passed',
    lastRun: new Date()
  }
];

// Dados para gráficos
const qualityTrendData = [
  { date: '01/01', score: 78, coverage: 82 },
  { date: '01/08', score: 81, coverage: 84 },
  { date: '01/15', score: 85, coverage: 85 },
  { date: '01/22', score: 83, coverage: 87 },
  { date: '01/29', score: 87, coverage: 89 }
];

const issueDistributionData = [
  { name: 'Bugs', value: 12, color: '#EF4444' },
  { name: 'Vulnerabilidades', value: 5, color: '#F97316' },
  { name: 'Code Smells', value: 23, color: '#EAB308' },
  { name: 'Duplicação', value: 8, color: '#8B5CF6' },
  { name: 'Complexidade', value: 15, color: '#06B6D4' }
];

const radarData = [
  { metric: 'Cobertura', current: 85, target: 80 },
  { metric: 'Qualidade', current: 78, target: 85 },
  { metric: 'Segurança', current: 92, target: 90 },
  { metric: 'Manutenibilidade', current: 75, target: 80 },
  { metric: 'Confiabilidade', current: 88, target: 85 },
  { metric: 'Performance', current: 82, target: 80 }
];

export default CodeQualityAnalyzer;