import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Zap,
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Target,
  Users,
  Clock,
  BarChart3,
  Settings,
  Play,
  Download,
  RefreshCw,
  Lightbulb,
  Eye,
  Mic,
  Video
} from 'lucide-react';

interface AIEngineProps {
  projectId?: string;
  onScriptGenerated?: (script: string) => void;
  onComplianceAnalyzed?: (analysis: ComplianceAnalysis) => void;
}

interface ComplianceAnalysis {
  score: number;
  issues: ComplianceIssue[];
  recommendations: string[];
  nrCompliance: NRCompliance[];
}

interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  nrReference?: string;
}

interface NRCompliance {
  nr: string;
  name: string;
  compliance: number;
  requirements: string[];
  status: 'compliant' | 'partial' | 'non-compliant';
}

interface AIProcessingState {
  isProcessing: boolean;
  currentStep: string;
  progress: number;
  results?: any;
}

const AIEngine: React.FC<AIEngineProps> = ({
  projectId,
  onScriptGenerated,
  onComplianceAnalyzed
}) => {
  const [activeTab, setActiveTab] = useState('script-generator');
  const [processingState, setProcessingState] = useState<AIProcessingState>({
    isProcessing: false,
    currentStep: '',
    progress: 0
  });
  
  // Script Generator State
  const [scriptInput, setScriptInput] = useState({
    topic: '',
    duration: 5,
    audience: '',
    nrFocus: '',
    tone: 'professional',
    includeQuiz: true,
    include3D: true
  });
  const [generatedScript, setGeneratedScript] = useState('');
  
  // Compliance Analyzer State
  const [complianceAnalysis, setComplianceAnalysis] = useState<ComplianceAnalysis | null>(null);
  const [contentToAnalyze, setContentToAnalyze] = useState('');
  
  // Mock data for NR compliance
  const availableNRs = [
    { id: 'nr-10', name: 'NR-10 - Segurança em Instalações e Serviços em Eletricidade' },
    { id: 'nr-35', name: 'NR-35 - Trabalho em Altura' },
    { id: 'nr-33', name: 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados' },
    { id: 'nr-06', name: 'NR-06 - Equipamentos de Proteção Individual' },
    { id: 'nr-12', name: 'NR-12 - Segurança no Trabalho em Máquinas e Equipamentos' }
  ];

  const generateScript = async () => {
    setProcessingState({
      isProcessing: true,
      currentStep: 'Analisando requisitos...',
      progress: 10
    });

    // Simulate AI processing steps
    const steps = [
      { step: 'Analisando requisitos de NR...', progress: 20 },
      { step: 'Gerando estrutura do roteiro...', progress: 40 },
      { step: 'Criando conteúdo educativo...', progress: 60 },
      { step: 'Adicionando elementos interativos...', progress: 80 },
      { step: 'Finalizando roteiro...', progress: 100 }
    ];

    for (const { step, progress } of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingState(prev => ({ ...prev, currentStep: step, progress }));
    }

    // Generate mock script
    const script = `# Treinamento: ${scriptInput.topic}

## Introdução (0:00 - 0:30)
- Apresentação do tema
- Importância da ${scriptInput.nrFocus}
- Objetivos do treinamento

## Desenvolvimento (0:30 - ${scriptInput.duration - 1}:00)
### Conceitos Fundamentais
- Definições importantes
- Riscos identificados
- Medidas preventivas

### Cenários Práticos
- Situações do dia a dia
- Demonstrações 3D
- Casos reais

### Procedimentos de Segurança
- Passo a passo
- EPIs necessários
- Protocolos de emergência

## Quiz Interativo (${scriptInput.duration - 1}:00 - ${scriptInput.duration}:00)
1. Quais são os principais riscos?
2. Como proceder em emergências?
3. Equipamentos obrigatórios?

## Conclusão
- Resumo dos pontos principais
- Próximos passos
- Certificação`;

    setGeneratedScript(script);
    setProcessingState({ isProcessing: false, currentStep: '', progress: 0 });
    onScriptGenerated?.(script);
  };

  const analyzeCompliance = async () => {
    setProcessingState({
      isProcessing: true,
      currentStep: 'Analisando conteúdo...',
      progress: 10
    });

    const steps = [
      { step: 'Verificando conformidade NR...', progress: 30 },
      { step: 'Identificando gaps de compliance...', progress: 60 },
      { step: 'Gerando recomendações...', progress: 90 },
      { step: 'Finalizando análise...', progress: 100 }
    ];

    for (const { step, progress } of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessingState(prev => ({ ...prev, currentStep: step, progress }));
    }

    // Generate mock compliance analysis
    const analysis: ComplianceAnalysis = {
      score: 85,
      issues: [
        {
          id: '1',
          severity: 'medium',
          description: 'Falta menção específica aos EPIs obrigatórios',
          suggestion: 'Adicionar seção detalhada sobre equipamentos de proteção individual',
          nrReference: 'NR-06'
        },
        {
          id: '2',
          severity: 'low',
          description: 'Procedimentos de emergência poderiam ser mais detalhados',
          suggestion: 'Incluir fluxograma de ações em caso de acidente',
          nrReference: 'NR-10'
        }
      ],
      recommendations: [
        'Adicionar mais cenários práticos de aplicação',
        'Incluir checklist de verificação de segurança',
        'Expandir seção sobre responsabilidades legais',
        'Adicionar referências normativas atualizadas'
      ],
      nrCompliance: [
        {
          nr: 'NR-10',
          name: 'Segurança em Eletricidade',
          compliance: 90,
          requirements: ['Treinamento obrigatório', 'Procedimentos de segurança', 'EPIs específicos'],
          status: 'compliant'
        },
        {
          nr: 'NR-35',
          name: 'Trabalho em Altura',
          compliance: 75,
          requirements: ['Capacitação', 'Análise de risco', 'Sistemas de proteção'],
          status: 'partial'
        }
      ]
    };

    setComplianceAnalysis(analysis);
    setProcessingState({ isProcessing: false, currentStep: '', progress: 0 });
    onComplianceAnalyzed?.(analysis);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'non-compliant': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Engine</h1>
          <Badge variant="secondary">Powered by IA Avançada</Badge>
        </div>
        <p className="text-gray-600">
          Sistema inteligente para geração de roteiros e análise de compliance em treinamentos de segurança
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="script-generator" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Gerador de Roteiros</span>
          </TabsTrigger>
          <TabsTrigger value="compliance-analyzer" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Análise de Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Insights IA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="script-generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Gerador Inteligente de Roteiros</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tópico do Treinamento</label>
                    <Input
                      placeholder="Ex: Segurança em Trabalho em Altura"
                      value={scriptInput.topic}
                      onChange={(e) => setScriptInput(prev => ({ ...prev, topic: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Duração (minutos)</label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={scriptInput.duration}
                      onChange={(e) => setScriptInput(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Público-Alvo</label>
                    <Input
                      placeholder="Ex: Técnicos em eletricidade"
                      value={scriptInput.audience}
                      onChange={(e) => setScriptInput(prev => ({ ...prev, audience: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Foco em NR</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={scriptInput.nrFocus}
                      onChange={(e) => setScriptInput(prev => ({ ...prev, nrFocus: e.target.value }))}
                    >
                      <option value="">Selecione uma NR</option>
                      {availableNRs.map(nr => (
                        <option key={nr.id} value={nr.id}>{nr.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tom do Conteúdo</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={scriptInput.tone}
                      onChange={(e) => setScriptInput(prev => ({ ...prev, tone: e.target.value }))}
                    >
                      <option value="professional">Profissional</option>
                      <option value="friendly">Amigável</option>
                      <option value="technical">Técnico</option>
                      <option value="educational">Educativo</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={scriptInput.includeQuiz}
                        onChange={(e) => setScriptInput(prev => ({ ...prev, includeQuiz: e.target.checked }))}
                      />
                      <span className="text-sm">Incluir quiz interativo</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={scriptInput.include3D}
                        onChange={(e) => setScriptInput(prev => ({ ...prev, include3D: e.target.checked }))}
                      />
                      <span className="text-sm">Incluir cenários 3D</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex space-x-3">
                <Button 
                  onClick={generateScript}
                  disabled={processingState.isProcessing || !scriptInput.topic}
                  className="flex items-center space-x-2"
                >
                  {processingState.isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>Gerar Roteiro</span>
                </Button>
                
                {generatedScript && (
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Exportar</span>
                  </Button>
                )}
              </div>
              
              {processingState.isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{processingState.currentStep}</span>
                    <span>{processingState.progress}%</span>
                  </div>
                  <Progress value={processingState.progress} className="w-full" />
                </div>
              )}
              
              {generatedScript && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Roteiro Gerado</span>
                  </h3>
                  <Textarea
                    value={generatedScript}
                    onChange={(e) => setGeneratedScript(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mic className="w-3 h-3 mr-1" />
                      Gerar Narração
                    </Button>
                    <Button size="sm" variant="outline">
                      <Video className="w-3 h-3 mr-1" />
                      Criar Vídeo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance-analyzer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Analisador de Compliance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Conteúdo para Análise</label>
                <Textarea
                  placeholder="Cole aqui o conteúdo do treinamento para análise de compliance..."
                  value={contentToAnalyze}
                  onChange={(e) => setContentToAnalyze(e.target.value)}
                  rows={6}
                />
              </div>
              
              <Button 
                onClick={analyzeCompliance}
                disabled={processingState.isProcessing || !contentToAnalyze}
                className="flex items-center space-x-2"
              >
                {processingState.isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span>Analisar Compliance</span>
              </Button>
              
              {processingState.isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{processingState.currentStep}</span>
                    <span>{processingState.progress}%</span>
                  </div>
                  <Progress value={processingState.progress} className="w-full" />
                </div>
              )}
              
              {complianceAnalysis && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {complianceAnalysis.score}%
                        </div>
                        <div className="text-sm text-gray-600">Score de Compliance</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {complianceAnalysis.issues.length}
                        </div>
                        <div className="text-sm text-gray-600">Issues Identificadas</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {complianceAnalysis.recommendations.length}
                        </div>
                        <div className="text-sm text-gray-600">Recomendações</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Issues Identificadas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {complianceAnalysis.issues.map((issue) => (
                          <div key={issue.id} className="border rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${getSeverityColor(issue.severity)}`} />
                              <Badge variant="outline" className="text-xs">
                                {issue.nrReference}
                              </Badge>
                              <span className="text-xs text-gray-500 capitalize">
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-sm font-medium mb-1">{issue.description}</p>
                            <p className="text-xs text-gray-600">{issue.suggestion}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Compliance por NR</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {complianceAnalysis.nrCompliance.map((nr) => (
                          <div key={nr.nr} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{nr.nr}</span>
                              <Badge className={getComplianceColor(nr.status)}>
                                {nr.compliance}%
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{nr.name}</p>
                            <Progress value={nr.compliance} className="h-2" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Lightbulb className="w-4 h-4" />
                        <span>Recomendações IA</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {complianceAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Eficácia do Treinamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">92%</div>
                <p className="text-sm text-gray-600">
                  Taxa de retenção de conhecimento baseada em análise IA
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Engajamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">87%</div>
                <p className="text-sm text-gray-600">
                  Nível de interação e participação dos usuários
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Tempo Otimizado</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">65%</div>
                <p className="text-sm text-gray-600">
                  Redução no tempo de criação com IA
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insights Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Padrão de Aprendizagem Identificado</p>
                    <p className="text-xs text-gray-600">
                      Usuários respondem melhor a cenários 3D interativos em treinamentos de NR-35
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Melhoria de Compliance</p>
                    <p className="text-xs text-gray-600">
                      Adição de quizzes aumentou a conformidade NR em 23%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Área de Atenção</p>
                    <p className="text-xs text-gray-600">
                      Conteúdos sobre EPIs precisam de mais exemplos práticos
                    </p>
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

export default AIEngine;