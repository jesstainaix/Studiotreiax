import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target, 
  Lightbulb, 
  FileText, 
  Download, 
  Upload,
  RefreshCw,
  Eye,
  Settings,
  Zap,
  Star,
  ArrowRight,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

// Interfaces
interface AnalysisType {
  id: string;
  name: string;
  description: string;
  metrics: string[];
}

interface Suggestion {
  id: string | number;
  metric: string;
  score: number;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  category: string;
}

interface Analysis {
  id: string;
  userId: string;
  content: string;
  contentType: string;
  overallScore: number;
  analyses: any[];
  prioritySuggestions: Suggestion[];
  totalSuggestions: number;
  createdAt: string;
  settings: any;
}

interface OptimizationSettings {
  targetAudience: string;
  goals: string[];
  contentType: string;
  analysisTypes: string[];
  autoApply: boolean;
  preserveStyle: boolean;
}

interface ComparisonResult {
  improvements: {
    seo: number;
    engagement: number;
    accessibility: number;
    readability: number;
  };
  metrics: {
    wordCount: { original: number; optimized: number; change: number };
    readingTime: { original: number; optimized: number; change: number };
    keywordDensity: { original: number; optimized: number; change: number };
  };
  highlights: string[];
  recommendation: string;
}

const ContentOptimizer: React.FC = () => {
  // Estados principais
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [optimizedContent, setOptimizedContent] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisType[]>([]);
  const [reports, setReports] = useState<Analysis[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  
  // Estados de configuração
  const [settings, setSettings] = useState<OptimizationSettings>({
    targetAudience: 'general',
    goals: ['engagement'],
    contentType: 'script',
    analysisTypes: ['seo', 'engagement', 'accessibility'],
    autoApply: false,
    preserveStyle: true
  });
  
  // Estados de UI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Carregar dados iniciais
  useEffect(() => {
    loadAnalysisTypes();
    loadReports();
  }, []);
  
  const loadAnalysisTypes = async () => {
    try {
      const response = await fetch('/api/ai/optimization/types');
      const data = await response.json();
      
      if (data.success) {
        setAnalysisTypes(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de análise:', error);
      toast.error('Erro ao carregar tipos de análise');
    }
  };
  
  const loadReports = async () => {
    try {
      const response = await fetch('/api/ai/optimization/reports');
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  };
  
  const analyzeContent = async () => {
    if (!content.trim()) {
      toast.error('Por favor, insira o conteúdo para análise');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/ai/optimization/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          contentType: settings.contentType,
          analysisTypes: settings.analysisTypes,
          settings
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentAnalysis(data.analysis);
        setOriginalContent(content);
        toast.success(
          data.cached 
            ? 'Análise carregada do cache' 
            : 'Análise concluída com sucesso'
        );
        
        // Carregar sugestões
        await generateSuggestions();
      } else {
        toast.error(data.message || 'Erro ao analisar conteúdo');
      }
    } catch (error) {
      console.error('Erro ao analisar conteúdo:', error);
      toast.error('Erro ao analisar conteúdo');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const generateSuggestions = async () => {
    try {
      const response = await fetch('/api/ai/optimization/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          contentType: settings.contentType,
          targetAudience: settings.targetAudience,
          goals: settings.goals
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
    }
  };
  
  const applyOptimizations = async () => {
    if (selectedSuggestions.length === 0) {
      toast.error('Selecione pelo menos uma sugestão para aplicar');
      return;
    }
    
    setIsOptimizing(true);
    
    try {
      const response = await fetch('/api/ai/optimization/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: originalContent,
          optimizationIds: selectedSuggestions,
          settings
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOptimizedContent(data.result.optimizedContent);
        toast.success('Otimizações aplicadas com sucesso');
        
        // Comparar automaticamente se habilitado
        if (settings.autoApply) {
          await compareVersions();
        }
      } else {
        toast.error(data.message || 'Erro ao aplicar otimizações');
      }
    } catch (error) {
      console.error('Erro ao aplicar otimizações:', error);
      toast.error('Erro ao aplicar otimizações');
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const compareVersions = async () => {
    if (!originalContent || !optimizedContent) {
      toast.error('É necessário ter conteúdo original e otimizado para comparar');
      return;
    }
    
    setIsComparing(true);
    
    try {
      const response = await fetch('/api/ai/optimization/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalContent,
          optimizedContent,
          contentType: settings.contentType
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setComparison(data.comparison);
        setShowComparison(true);
        toast.success('Comparação concluída');
      } else {
        toast.error(data.message || 'Erro ao comparar versões');
      }
    } catch (error) {
      console.error('Erro ao comparar versões:', error);
      toast.error('Erro ao comparar versões');
    } finally {
      setIsComparing(false);
    }
  };
  
  const toggleSuggestionSelection = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId)
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };
  
  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'low': return <Zap className="h-4 w-4 text-green-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'high': return <Target className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };
  
  const filteredSuggestions = suggestions.filter(suggestion => {
    const severityMatch = filterSeverity === 'all' || suggestion.severity === filterSeverity;
    const categoryMatch = filterCategory === 'all' || suggestion.category.toLowerCase().includes(filterCategory.toLowerCase());
    return severityMatch && categoryMatch;
  });
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Otimizador de Conteúdo IA</h1>
          <p className="text-muted-foreground mt-2">
            Analise e otimize seu conteúdo com inteligência artificial
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurações de Otimização</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Conteúdo</Label>
                  <Select 
                    value={settings.contentType} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="script">Roteiro</SelectItem>
                      <SelectItem value="storyboard">Storyboard</SelectItem>
                      <SelectItem value="captions">Legendas</SelectItem>
                      <SelectItem value="description">Descrição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Público-alvo</Label>
                  <Select 
                    value={settings.targetAudience} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, targetAudience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="young_adults">Jovens Adultos</SelectItem>
                      <SelectItem value="professionals">Profissionais</SelectItem>
                      <SelectItem value="students">Estudantes</SelectItem>
                      <SelectItem value="seniors">Idosos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Tipos de Análise</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {analysisTypes.map(type => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={settings.analysisTypes.includes(type.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSettings(prev => ({
                                ...prev,
                                analysisTypes: [...prev.analysisTypes, type.id]
                              }));
                            } else {
                              setSettings(prev => ({
                                ...prev,
                                analysisTypes: prev.analysisTypes.filter(t => t !== type.id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={type.id} className="text-sm">
                          {type.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoApply"
                    checked={settings.autoApply}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoApply: checked as boolean }))
                    }
                  />
                  <Label htmlFor="autoApply">Aplicar otimizações automaticamente</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveStyle"
                    checked={settings.preserveStyle}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, preserveStyle: checked as boolean }))
                    }
                  />
                  <Label htmlFor="preserveStyle">Preservar estilo original</Label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={loadReports} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analyze">Analisar</TabsTrigger>
          <TabsTrigger value="optimize">Otimizar</TabsTrigger>
          <TabsTrigger value="compare">Comparar</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise de Conteúdo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content">Conteúdo para Análise</Label>
                <Textarea
                  id="content"
                  placeholder="Cole aqui o conteúdo que deseja analisar..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={analyzeContent} 
                  disabled={isAnalyzing || !content.trim()}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analisando...' : 'Analisar Conteúdo'}
                </Button>
                
                <Button variant="outline" onClick={() => setContent('')}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {currentAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Resultado da Análise</span>
                  <Badge variant="outline" className={getScoreColor(currentAnalysis.overallScore)}>
                    Score: {currentAnalysis.overallScore}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Score Geral</span>
                      <span className={`text-sm font-bold ${getScoreColor(currentAnalysis.overallScore)}`}>
                        {currentAnalysis.overallScore}%
                      </span>
                    </div>
                    <Progress value={currentAnalysis.overallScore} className="h-2" />
                  </div>
                  
                  {currentAnalysis.prioritySuggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Sugestões Prioritárias</h4>
                      <div className="space-y-2">
                        {currentAnalysis.prioritySuggestions.slice(0, 3).map(suggestion => (
                          <Alert key={suggestion.id}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex items-center justify-between">
                                <span>{suggestion.suggestion}</span>
                                <Badge variant={getSeverityColor(suggestion.severity)}>
                                  {suggestion.severity}
                                </Badge>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total de Sugestões:</span>
                      <span className="ml-2 font-medium">{currentAnalysis.totalSuggestions}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo de Conteúdo:</span>
                      <span className="ml-2 font-medium capitalize">{currentAnalysis.contentType}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="optimize" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sugestões de Otimização</h2>
            
            <div className="flex gap-2">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="engagement">Engajamento</SelectItem>
                  <SelectItem value="accessibility">Acessibilidade</SelectItem>
                  <SelectItem value="technical">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredSuggestions.length > 0 ? (
            <>
              <div className="space-y-3">
                {filteredSuggestions.map(suggestion => (
                  <Card key={suggestion.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedSuggestions.includes(suggestion.id.toString())}
                          onCheckedChange={() => toggleSuggestionSelection(suggestion.id.toString())}
                        />
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={getSeverityColor(suggestion.severity)}>
                                {suggestion.severity}
                              </Badge>
                              <Badge variant="outline">
                                {suggestion.category}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getEffortIcon(suggestion.effort)}
                              <span className="text-sm text-muted-foreground">
                                +{suggestion.impact}% impacto
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm">{suggestion.suggestion}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Métrica: {suggestion.metric}</span>
                            <span>Score atual: {suggestion.score}%</span>
                            <span>Esforço: {suggestion.effort}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={applyOptimizations}
                  disabled={isOptimizing || selectedSuggestions.length === 0}
                  className="flex-1"
                >
                  {isOptimizing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {isOptimizing ? 'Aplicando...' : `Aplicar ${selectedSuggestions.length} Otimizações`}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSuggestions([])}
                  disabled={selectedSuggestions.length === 0}
                >
                  Limpar Seleção
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma sugestão disponível</h3>
                <p className="text-muted-foreground mb-4">
                  Execute uma análise primeiro para obter sugestões de otimização
                </p>
                <Button onClick={() => setActiveTab('analyze')}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Ir para Análise
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Comparação de Versões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Conteúdo Original</Label>
                  <Textarea
                    value={originalContent}
                    onChange={(e) => setOriginalContent(e.target.value)}
                    rows={6}
                    className="mt-2"
                    placeholder="Conteúdo original..."
                  />
                </div>
                
                <div>
                  <Label>Conteúdo Otimizado</Label>
                  <Textarea
                    value={optimizedContent}
                    onChange={(e) => setOptimizedContent(e.target.value)}
                    rows={6}
                    className="mt-2"
                    placeholder="Conteúdo otimizado..."
                  />
                </div>
              </div>
              
              <Button 
                onClick={compareVersions}
                disabled={isComparing || !originalContent || !optimizedContent}
                className="w-full"
              >
                {isComparing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {isComparing ? 'Comparando...' : 'Comparar Versões'}
              </Button>
            </CardContent>
          </Card>
          
          {comparison && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado da Comparação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(comparison.improvements).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-green-600">+{value}%</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {key.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(comparison.metrics).map(([key, metric]) => (
                    <Card key={key}>
                      <CardContent className="p-4 text-center">
                        <div className="text-lg font-semibold capitalize mb-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>Original: {metric.original}</div>
                          <div>Otimizado: {metric.optimized}</div>
                          <div className={`font-medium ${
                            metric.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Principais Melhorias</h4>
                  <div className="space-y-2">
                    {comparison.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Alert>
                  <Star className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recomendação:</strong> {comparison.recommendation}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Histórico de Análises</h2>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </div>
          </div>
          
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map(report => (
                <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">
                            Análise {report.contentType}
                          </span>
                          <Badge variant="outline" className={getScoreColor(report.overallScore)}>
                            {report.overallScore}/100
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {report.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          <span>{report.totalSuggestions} sugestões</span>
                          <span>{report.prioritySuggestions.length} prioritárias</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Execute análises para ver o histórico aqui
                </p>
                <Button onClick={() => setActiveTab('analyze')}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Criar Primeira Análise
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentOptimizer;