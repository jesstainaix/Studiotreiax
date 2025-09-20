import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Switch } from '../ui/switch';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Brain,
  Code,
  FileText,
  Settings,
  BarChart3,
  Filter,
  Search,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  Check,
  Save
} from 'lucide-react';
import { useAIScriptCorrection } from '../../hooks/useAIScriptCorrection';
import { toast } from 'sonner';

// Types
interface ScriptAnalysis {
  id: string;
  scriptName: string;
  filePath: string;
  status: 'analyzing' | 'completed' | 'error' | 'pending';
  errors: ScriptError[];
  suggestions: Suggestion[];
  metrics: QualityMetrics;
  lastAnalyzed: Date;
  corrections: Correction[];
}

interface ScriptError {
  id: string;
  type: 'syntax' | 'logic' | 'performance' | 'security' | 'style';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  line: number;
  column: number;
  code: string;
  suggestion?: string;
}

interface Suggestion {
  id: string;
  type: 'optimization' | 'refactor' | 'modernization' | 'best-practice';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'easy' | 'moderate' | 'complex';
  code: {
    before: string;
    after: string;
  };
}

interface Correction {
  id: string;
  errorId: string;
  type: 'automatic' | 'suggested' | 'manual';
  status: 'pending' | 'applied' | 'rejected';
  description: string;
  code: {
    original: string;
    corrected: string;
  };
  appliedAt?: Date;
}

interface QualityMetrics {
  score: number;
  maintainability: number;
  reliability: number;
  security: number;
  performance: number;
  complexity: number;
  coverage: number;
}

interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  version: string;
  capabilities: string[];
  isActive: boolean;
  config: Record<string, any>;
}

const AIScriptCorrectionPanel: React.FC = () => {
  const {
    analyses,
    isAnalyzing,
    error,
    analyzeScript,
    applyCorrection,
    rejectCorrection,
    getMetrics,
    exportReport
  } = useAIScriptCorrection();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(null);
  
  // Model configuration states
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  
  // Settings states
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(false);
  const [autoApplyCorrections, setAutoApplyCorrections] = useState(false);
  const [minConfidence, setMinConfidence] = useState(80);
  const [aiModels, setAiModels] = useState<AIModel[]>([
    {
      id: '1',
      name: 'GPT-4',
      provider: 'openai',
      version: '4.0',
      capabilities: ['code-analysis', 'error-detection', 'optimization'],
      isActive: true,
      config: { temperature: 0.1, maxTokens: 4000 }
    },
    {
      id: '2',
      name: 'Claude 3',
      provider: 'anthropic',
      version: '3.0',
      capabilities: ['code-review', 'security-analysis', 'refactoring'],
      isActive: false,
      config: { temperature: 0.2, maxTokens: 3000 }
    }
  ]);

  // Mock data for demonstration
  const mockAnalyses: ScriptAnalysis[] = [
    {
      id: '1',
      scriptName: 'userAuth.js',
      filePath: '/src/utils/userAuth.js',
      status: 'completed',
      lastAnalyzed: new Date(),
      errors: [
        {
          id: 'e1',
          type: 'security',
          severity: 'critical',
          message: 'Potential SQL injection vulnerability',
          line: 45,
          column: 12,
          code: 'SELECT * FROM users WHERE id = ' + userId,
          suggestion: 'Use parameterized queries'
        },
        {
          id: 'e2',
          type: 'performance',
          severity: 'medium',
          message: 'Inefficient database query',
          line: 78,
          column: 8,
          code: 'users.forEach(user => db.query(...))',
          suggestion: 'Use batch operations'
        }
      ],
      suggestions: [
        {
          id: 's1',
          type: 'modernization',
          title: 'Convert to async/await',
          description: 'Replace callback-based code with modern async/await syntax',
          impact: 'medium',
          effort: 'easy',
          code: {
            before: 'function getUser(id, callback) { ... }',
            after: 'async function getUser(id) { ... }'
          }
        }
      ],
      corrections: [
        {
          id: 'c1',
          errorId: 'e1',
          type: 'automatic',
          status: 'pending',
          description: 'Replace with parameterized query',
          code: {
            original: 'SELECT * FROM users WHERE id = ' + userId,
            corrected: 'SELECT * FROM users WHERE id = ?'
          }
        }
      ],
      metrics: {
        score: 72,
        maintainability: 68,
        reliability: 75,
        security: 45,
        performance: 80,
        complexity: 65,
        coverage: 85
      }
    }
  ];

  // Computed values
  const totalScripts = mockAnalyses.length;
  const completedAnalyses = mockAnalyses.filter(a => a.status === 'completed').length;
  const totalErrors = mockAnalyses.reduce((sum, a) => sum + a.errors.length, 0);
  const criticalErrors = mockAnalyses.reduce((sum, a) => 
    sum + a.errors.filter(e => e.severity === 'critical').length, 0
  );
  const pendingCorrections = mockAnalyses.reduce((sum, a) => 
    sum + a.corrections.filter(c => c.status === 'pending').length, 0
  );
  const averageScore = mockAnalyses.reduce((sum, a) => sum + a.metrics.score, 0) / totalScripts;

  // Filtered data
  const filteredAnalyses = mockAnalyses.filter(analysis => {
    const matchesSearch = analysis.scriptName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || 
      analysis.errors.some(e => e.severity === filterSeverity);
    const matchesType = filterType === 'all' || 
      analysis.errors.some(e => e.type === filterType);
    
    return matchesSearch && matchesSeverity && matchesType;
  });

  // Event handlers
  const handleAnalyzeScript = useCallback(async (scriptPath: string) => {
    try {
      await analyzeScript(scriptPath);
      toast.success('Script analysis completed successfully');
    } catch (error) {
      toast.error('Failed to analyze script');
    }
  }, [analyzeScript]);

  const handleApplyCorrection = useCallback(async (correctionId: string) => {
    try {
      await applyCorrection(correctionId);
      toast.success('Correction applied successfully');
    } catch (error) {
      toast.error('Failed to apply correction');
    }
  }, [applyCorrection]);

  const handleRejectCorrection = useCallback(async (correctionId: string) => {
    try {
      await rejectCorrection(correctionId);
      toast.success('Correction rejected');
    } catch (error) {
      toast.error('Failed to reject correction');
    }
  }, [rejectCorrection]);

  const handleSaveSettings = useCallback(() => {
    toast.success('Settings saved successfully');
    // Implement settings save logic
  }, [temperature, maxTokens, autoAnalysis, realTimeAnalysis, autoApplyCorrections, minConfidence]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-8 w-8 text-blue-600" />
              AI Script Correction
            </h1>
            <p className="text-gray-600 mt-1">
              Automated code analysis and intelligent error correction
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleAnalyzeScript('/current/script.js')}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Current Script'}
            </Button>
            <Button variant="outline" onClick={() => exportReport()}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analyses" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Erros
            </TabsTrigger>
            <TabsTrigger value="corrections" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Correções
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Modelos
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Scripts</CardTitle>
                  <Code className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalScripts}</div>
                  <p className="text-xs text-muted-foreground">
                    {completedAnalyses} analyzed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
                  <p className="text-xs text-muted-foreground">
                    {criticalErrors} critical
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Corrections</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingCorrections}</div>
                  <p className="text-xs text-muted-foreground">
                    Ready to apply
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(averageScore)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quality score
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest script analyses and corrections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {mockAnalyses.slice(0, 5).map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{analysis.scriptName}</p>
                            <p className="text-sm text-gray-600">
                              {analysis.errors.length} errors found
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={analysis.status === 'completed' ? 'default' : 'secondary'}>
                            {analysis.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {analysis.lastAnalyzed.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analyses Tab */}
          <TabsContent value="analyses" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <Label htmlFor="search">Search Scripts</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by script name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="min-w-48">
                    <Label htmlFor="severity-filter">Severity</Label>
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger>
                        <SelectValue placeholder="All severities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-48">
                    <Label htmlFor="type-filter">Error Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="syntax">Syntax</SelectItem>
                        <SelectItem value="logic">Logic</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="style">Style</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scripts List */}
            <Card>
              <CardHeader>
                <CardTitle>Script Analyses ({filteredAnalyses.length})</CardTitle>
                <CardDescription>
                  Detailed analysis results for all scripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedScript === analysis.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedScript(analysis.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{analysis.scriptName}</h3>
                              <p className="text-sm text-gray-600">{analysis.filePath}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={analysis.status === 'completed' ? 'default' : 'secondary'}>
                              {analysis.status}
                            </Badge>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {analysis.metrics.score}
                              </div>
                              <div className="text-xs text-gray-500">Score</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-red-600">
                              {analysis.errors.length}
                            </div>
                            <div className="text-xs text-gray-500">Errors</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-yellow-600">
                              {analysis.suggestions.length}
                            </div>
                            <div className="text-xs text-gray-500">Suggestions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              {analysis.corrections.filter(c => c.status === 'applied').length}
                            </div>
                            <div className="text-xs text-gray-500">Applied</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              {analysis.corrections.filter(c => c.status === 'pending').length}
                            </div>
                            <div className="text-xs text-gray-500">Pending</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {analysis.errors.slice(0, 3).map((error) => (
                              <Badge
                                key={error.id}
                                variant="outline"
                                className={getSeverityColor(error.severity)}
                              >
                                {getSeverityIcon(error.severity)}
                                <span className="ml-1">{error.severity}</span>
                              </Badge>
                            ))}
                            {analysis.errors.length > 3 && (
                              <Badge variant="outline" className="text-gray-600">
                                +{analysis.errors.length - 3} more
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Last analyzed: {analysis.lastAnalyzed.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors" className="space-y-6">
            {selectedScript ? (
              <>
                {/* Error Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Error Details - {mockAnalyses.find(a => a.id === selectedScript)?.scriptName}
                    </CardTitle>
                    <CardDescription>
                      Detailed view of detected errors and suggestions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {['critical', 'high', 'medium', 'low'].map((severity) => {
                        const count = mockAnalyses.find(a => a.id === selectedScript)?.errors.filter(e => e.severity === severity).length || 0;
                        return (
                          <div key={severity} className="text-center p-4 border rounded-lg">
                            <div className={`text-2xl font-bold ${
                              severity === 'critical' ? 'text-red-600' :
                              severity === 'high' ? 'text-orange-600' :
                              severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              {count}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">{severity}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Error List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Error List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {mockAnalyses.find(a => a.id === selectedScript)?.errors.map((error) => (
                          <div key={error.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                  error.severity === 'critical' ? 'bg-red-50' :
                                  error.severity === 'high' ? 'bg-orange-50' :
                                  error.severity === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'
                                }`}>
                                  {getSeverityIcon(error.severity)}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">{error.message}</h3>
                                  <p className="text-sm text-gray-600 mt-1">{error.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span>Line {error.line}</span>
                                    <span>•</span>
                                    <span>Column {error.column}</span>
                                    <span>•</span>
                                    <span className="capitalize">{error.type}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={getSeverityColor(error.severity)}
                              >
                                {error.severity}
                              </Badge>
                            </div>
                            
                            {/* Code Context */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <div className="text-xs text-gray-500 mb-2">Code Context:</div>
                              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                                {error.codeContext}
                              </pre>
                            </div>
                            
                            {/* Suggestions */}
                            {error.suggestions && error.suggestions.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-700">Suggestions:</div>
                                {error.suggestions.map((suggestion, index) => (
                                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm text-blue-800">{suggestion.message}</p>
                                      {suggestion.fix && (
                                        <div className="mt-2">
                                          <div className="text-xs text-blue-600 mb-1">Suggested Fix:</div>
                                          <pre className="text-xs font-mono bg-white p-2 rounded border text-gray-800">
                                            {suggestion.fix}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                    {suggestion.autoFixable && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleApplyFix(error.id, suggestion)}
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                      >
                                        <Zap className="h-3 w-3 mr-1" />
                                        Apply Fix
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Script Selected</h3>
                  <p className="text-gray-500">Select a script from the Analyses tab to view detailed error information.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Corrections Tab */}
          <TabsContent value="corrections" className="space-y-6">
            {selectedScript ? (
              <>
                {/* Correction Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-500" />
                      Auto Corrections - {mockAnalyses.find(a => a.id === selectedScript)?.scriptName}
                    </CardTitle>
                    <CardDescription>
                      Apply automatic corrections with preview
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {mockAnalyses.find(a => a.id === selectedScript)?.corrections.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Corrections</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {mockAnalyses.find(a => a.id === selectedScript)?.corrections.filter(c => c.status === 'applied').length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Applied</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {mockAnalyses.find(a => a.id === selectedScript)?.corrections.filter(c => c.status === 'pending').length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Pending</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApplyAllCorrections(selectedScript)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!mockAnalyses.find(a => a.id === selectedScript)?.corrections.some(c => c.status === 'pending')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Apply All Pending
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handlePreviewAllCorrections(selectedScript)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview All
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Corrections List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Corrections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {mockAnalyses.find(a => a.id === selectedScript)?.corrections.map((correction) => (
                          <div key={correction.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                  correction.status === 'applied' ? 'bg-green-50' :
                                  correction.status === 'pending' ? 'bg-yellow-50' : 'bg-gray-50'
                                }`}>
                                  {correction.status === 'applied' ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : correction.status === 'pending' ? (
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                  ) : (
                                    <X className="h-5 w-5 text-gray-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">{correction.title}</h3>
                                  <p className="text-sm text-gray-600 mt-1">{correction.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span>Line {correction.line}</span>
                                    <span>•</span>
                                    <span className="capitalize">{correction.type}</span>
                                    <span>•</span>
                                    <span className={`capitalize ${
                                      correction.confidence >= 0.9 ? 'text-green-600' :
                                      correction.confidence >= 0.7 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {correction.confidence >= 0.9 ? 'High' :
                                       correction.confidence >= 0.7 ? 'Medium' : 'Low'} Confidence
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={correction.status === 'applied' ? 'default' : 'secondary'}
                                  className={correction.status === 'applied' ? 'bg-green-100 text-green-800' : ''}
                                >
                                  {correction.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Code Diff */}
                            <div className="space-y-3">
                              <div className="text-sm font-medium text-gray-700">Code Changes:</div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-red-600 mb-2 flex items-center gap-1">
                                    <Minus className="h-3 w-3" />
                                    Before
                                  </div>
                                  <pre className="text-xs font-mono bg-red-50 p-3 rounded border text-gray-800 whitespace-pre-wrap">
                                    {correction.originalCode}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-xs text-green-600 mb-2 flex items-center gap-1">
                                    <Plus className="h-3 w-3" />
                                    After
                                  </div>
                                  <pre className="text-xs font-mono bg-green-50 p-3 rounded border text-gray-800 whitespace-pre-wrap">
                                    {correction.correctedCode}
                                  </pre>
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-xs text-gray-500">
                                Impact: {correction.impact} • Confidence: {(correction.confidence * 100).toFixed(0)}%
                              </div>
                              <div className="flex gap-2">
                                {correction.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePreviewCorrection(correction.id)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Preview
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApplyCorrection(correction.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Apply
                                    </Button>
                                  </>
                                )}
                                {correction.status === 'applied' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRevertCorrection(correction.id)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Revert
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Script Selected</h3>
                  <p className="text-gray-500">Select a script from the Analyses tab to view available corrections.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI Models Configuration
                </CardTitle>
                <CardDescription>
                  Configure AI models and their parameters for script analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Model */}
                <div>
                  <Label className="text-base font-semibold">Current Model</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">GPT-4 Turbo</h3>
                        <p className="text-sm text-blue-700">Advanced code analysis and correction</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                    </div>
                  </div>
                </div>

                {/* Available Models */}
                <div>
                  <Label className="text-base font-semibold">Available Models</Label>
                  <div className="mt-2 space-y-3">
                    {[
                      {
                        name: 'GPT-4 Turbo',
                        description: 'Most advanced model for complex code analysis',
                        speed: 'Medium',
                        accuracy: 'Very High',
                        cost: 'High',
                        active: true
                      },
                      {
                        name: 'GPT-3.5 Turbo',
                        description: 'Fast and efficient for basic corrections',
                        speed: 'Fast',
                        accuracy: 'High',
                        cost: 'Low',
                        active: false
                      },
                      {
                        name: 'Claude 3 Sonnet',
                        description: 'Excellent for code quality and best practices',
                        speed: 'Medium',
                        accuracy: 'Very High',
                        cost: 'Medium',
                        active: false
                      }
                    ].map((model) => (
                      <div key={model.name} className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        model.active ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{model.name}</h3>
                          {model.active && <Badge className="bg-blue-100 text-blue-800">Active</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Speed:</span>
                            <span className={`ml-1 font-medium ${
                              model.speed === 'Fast' ? 'text-green-600' :
                              model.speed === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                            }`}>{model.speed}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Accuracy:</span>
                            <span className={`ml-1 font-medium ${
                              model.accuracy === 'Very High' ? 'text-green-600' :
                              model.accuracy === 'High' ? 'text-blue-600' : 'text-yellow-600'
                            }`}>{model.accuracy}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Cost:</span>
                            <span className={`ml-1 font-medium ${
                              model.cost === 'Low' ? 'text-green-600' :
                              model.cost === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                            }`}>{model.cost}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Parameters */}
                <div>
                  <Label className="text-base font-semibold">Model Parameters</Label>
                  <div className="mt-2 space-y-4">
                    <div>
                      <Label htmlFor="temperature">Temperature: {temperature}</Label>
                      <input
                        id="temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full mt-1"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Conservative</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="max-tokens">Max Tokens</Label>
                      <Input
                        id="max-tokens"
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-500" />
                  Analysis Settings
                </CardTitle>
                <CardDescription>
                  Configure analysis and correction preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto Analysis */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Auto Analysis</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-analysis">Enable automatic analysis</Label>
                        <p className="text-sm text-gray-600">Automatically analyze scripts when they are saved</p>
                      </div>
                      <input
                        id="auto-analysis"
                        type="checkbox"
                        checked={autoAnalysis}
                        onChange={(e) => setAutoAnalysis(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="real-time-analysis">Real-time analysis</Label>
                        <p className="text-sm text-gray-600">Analyze code as you type (may impact performance)</p>
                      </div>
                      <input
                        id="real-time-analysis"
                        type="checkbox"
                        checked={realTimeAnalysis}
                        onChange={(e) => setRealTimeAnalysis(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                </div>

                {/* Correction Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Correction Settings</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-apply">Auto-apply high confidence corrections</Label>
                        <p className="text-sm text-gray-600">Automatically apply corrections with confidence ≥ 90%</p>
                      </div>
                      <input
                        id="auto-apply"
                        type="checkbox"
                        checked={autoApplyCorrections}
                        onChange={(e) => setAutoApplyCorrections(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="min-confidence">Minimum confidence threshold: {minConfidence}%</Label>
                      <input
                        id="min-confidence"
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={minConfidence}
                        onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                        className="w-full mt-1"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>50%</span>
                        <span>95%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Types */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Error Types to Analyze</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'syntax', label: 'Syntax Errors', checked: true },
                      { key: 'logic', label: 'Logic Errors', checked: true },
                      { key: 'performance', label: 'Performance Issues', checked: true },
                      { key: 'security', label: 'Security Vulnerabilities', checked: true },
                      { key: 'style', label: 'Code Style', checked: false },
                      { key: 'accessibility', label: 'Accessibility', checked: false }
                    ].map((errorType) => (
                      <div key={errorType.key} className="flex items-center space-x-2">
                        <input
                          id={errorType.key}
                          type="checkbox"
                          defaultChecked={errorType.checked}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={errorType.key} className="text-sm">{errorType.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Notifications</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notify-errors">Notify on new errors</Label>
                        <p className="text-sm text-gray-600">Show notifications when new errors are detected</p>
                      </div>
                      <input
                        id="notify-errors"
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notify-corrections">Notify on applied corrections</Label>
                        <p className="text-sm text-gray-600">Show notifications when corrections are applied</p>
                      </div>
                      <input
                        id="notify-corrections"
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Settings */}
                <div className="pt-4 border-t">
                  <Button onClick={handleSaveSettings} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
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

export default AIScriptCorrectionPanel;