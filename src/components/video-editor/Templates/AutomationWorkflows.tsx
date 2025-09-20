import React, { useState, useCallback, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Stop, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Zap, 
  Clock, 
  Target, 
  Filter, 
  ArrowRight, 
  ArrowDown, 
  ChevronRight, 
  ChevronDown, 
  MoreVertical, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Calendar, 
  Timer, 
  Repeat, 
  SkipForward, 
  Shuffle, 
  GitBranch, 
  Code, 
  Database, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Palette, 
  Move3D, 
  RotateCcw, 
  Maximize, 
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTemplates } from '@/hooks/useTemplates';
import { AutomationRule, AutomationWorkflow, AutomationAction, AutomationCondition } from '@/types/templates';

interface AutomationWorkflowsProps {
  onWorkflowExecute?: (workflow: AutomationWorkflow) => void;
  onWorkflowSave?: (workflow: AutomationWorkflow) => void;
  className?: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime: Date;
  endTime?: Date;
  logs: string[];
  error?: string;
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  position: { x: number; y: number };
  data: any;
  connections: string[];
}

const AutomationWorkflows: React.FC<AutomationWorkflowsProps> = ({
  onWorkflowExecute,
  onWorkflowSave,
  className = ''
}) => {
  // State
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [activeTab, setActiveTab] = useState('workflows');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);
  
  // Workflow builder state
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  
  // Form state
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    enabled: true,
    schedule: {
      type: 'manual' as 'manual' | 'interval' | 'cron',
      interval: 60,
      cron: '0 0 * * *'
    }
  });
  
  const { automationEngine } = useTemplates();
  
  // Load workflows
  useEffect(() => {
    loadWorkflows();
  }, []);
  
  const loadWorkflows = useCallback(() => {
    // Mock workflows data
    const mockWorkflows: AutomationWorkflow[] = [
      {
        id: 'workflow-1',
        name: 'Auto Template Application',
        description: 'Aplica templates automaticamente baseado no conteúdo',
        enabled: true,
        schedule: {
          type: 'manual'
        },
        rules: [
          {
            id: 'rule-1',
            name: 'Detect Video Type',
            conditions: [
              {
                type: 'content_type',
                operator: 'equals',
                value: 'video',
                target: 'media'
              }
            ],
            actions: [
              {
                type: 'apply_template',
                parameters: {
                  templateId: 'template-1',
                  autoAdjust: true
                }
              }
            ],
            priority: 1,
            enabled: true
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'workflow-2',
        name: 'Batch Processing',
        description: 'Processa múltiplos vídeos em lote',
        enabled: false,
        schedule: {
          type: 'interval',
          interval: 3600
        },
        rules: [
          {
            id: 'rule-2',
            name: 'Process Queue',
            conditions: [
              {
                type: 'queue_size',
                operator: 'greater_than',
                value: 5,
                target: 'system'
              }
            ],
            actions: [
              {
                type: 'batch_process',
                parameters: {
                  maxItems: 10,
                  template: 'default'
                }
              }
            ],
            priority: 2,
            enabled: true
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    setWorkflows(mockWorkflows);
  }, []);
  
  // Workflow operations
  const createWorkflow = useCallback(() => {
    const newWorkflow: AutomationWorkflow = {
      id: `workflow-${Date.now()}`,
      name: workflowForm.name || 'Novo Workflow',
      description: workflowForm.description,
      enabled: workflowForm.enabled,
      schedule: workflowForm.schedule,
      rules: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setWorkflows(prev => [...prev, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setIsCreating(false);
    setIsEditing(true);
    
    // Reset form
    setWorkflowForm({
      name: '',
      description: '',
      enabled: true,
      schedule: {
        type: 'manual',
        interval: 60,
        cron: '0 0 * * *'
      }
    });
  }, [workflowForm]);
  
  const updateWorkflow = useCallback((workflowId: string, updates: Partial<AutomationWorkflow>) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, ...updates, updatedAt: new Date() } : w
    ));
    
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  }, [selectedWorkflow]);
  
  const deleteWorkflow = useCallback((workflowId: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== workflowId));
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(null);
    }
  }, [selectedWorkflow]);
  
  const duplicateWorkflow = useCallback((workflow: AutomationWorkflow) => {
    const newWorkflow: AutomationWorkflow = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      name: `${workflow.name} (Cópia)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setWorkflows(prev => [...prev, newWorkflow]);
  }, []);
  
  // Workflow execution
  const executeWorkflow = useCallback(async (workflow: AutomationWorkflow) => {
    const execution: WorkflowExecution = {
      id: `execution-${Date.now()}`,
      workflowId: workflow.id,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      logs: [`Iniciando execução do workflow: ${workflow.name}`]
    };
    
    setExecutions(prev => [...prev, execution]);
    
    try {
      // Simulate workflow execution
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setExecutions(prev => prev.map(ex => 
          ex.id === execution.id 
            ? { 
                ...ex, 
                progress: i,
                logs: [...ex.logs, `Progresso: ${i}%`]
              }
            : ex
        ));
      }
      
      setExecutions(prev => prev.map(ex => 
        ex.id === execution.id 
          ? { 
              ...ex, 
              status: 'completed',
              progress: 100,
              endTime: new Date(),
              logs: [...ex.logs, 'Workflow executado com sucesso!']
            }
          : ex
      ));
      
      onWorkflowExecute?.(workflow);
    } catch (error) {
      setExecutions(prev => prev.map(ex => 
        ex.id === execution.id 
          ? { 
              ...ex, 
              status: 'failed',
              endTime: new Date(),
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              logs: [...ex.logs, `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
            }
          : ex
      ));
    }
  }, [onWorkflowExecute]);
  
  // Rule operations
  const addRule = useCallback(() => {
    if (!selectedWorkflow) return;
    
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: 'Nova Regra',
      conditions: [],
      actions: [],
      priority: selectedWorkflow.rules.length + 1,
      enabled: true
    };
    
    updateWorkflow(selectedWorkflow.id, {
      rules: [...selectedWorkflow.rules, newRule]
    });
  }, [selectedWorkflow, updateWorkflow]);
  
  const updateRule = useCallback((ruleId: string, updates: Partial<AutomationRule>) => {
    if (!selectedWorkflow) return;
    
    const updatedRules = selectedWorkflow.rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    
    updateWorkflow(selectedWorkflow.id, { rules: updatedRules });
  }, [selectedWorkflow, updateWorkflow]);
  
  const deleteRule = useCallback((ruleId: string) => {
    if (!selectedWorkflow) return;
    
    const updatedRules = selectedWorkflow.rules.filter(rule => rule.id !== ruleId);
    updateWorkflow(selectedWorkflow.id, { rules: updatedRules });
  }, [selectedWorkflow, updateWorkflow]);
  
  // Condition operations
  const addCondition = useCallback((ruleId: string) => {
    if (!selectedWorkflow) return;
    
    const newCondition: AutomationCondition = {
      type: 'content_type',
      operator: 'equals',
      value: '',
      target: 'media'
    };
    
    const updatedRules = selectedWorkflow.rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, conditions: [...rule.conditions, newCondition] }
        : rule
    );
    
    updateWorkflow(selectedWorkflow.id, { rules: updatedRules });
  }, [selectedWorkflow, updateWorkflow]);
  
  // Action operations
  const addAction = useCallback((ruleId: string) => {
    if (!selectedWorkflow) return;
    
    const newAction: AutomationAction = {
      type: 'apply_template',
      parameters: {}
    };
    
    const updatedRules = selectedWorkflow.rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, actions: [...rule.actions, newAction] }
        : rule
    );
    
    updateWorkflow(selectedWorkflow.id, { rules: updatedRules });
  }, [selectedWorkflow, updateWorkflow]);
  
  // Get status color
  const getStatusColor = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'running': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };
  
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Automation Workflows</h2>
            <p className="text-sm text-gray-500">Gerencie workflows de automação personalizáveis</p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Workflow</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Workflows List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="executions">Execuções</TabsTrigger>
            </TabsList>
            
            <TabsContent value="workflows" className="flex-1">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {workflows.map(workflow => (
                    <Card 
                      key={workflow.id}
                      className={`cursor-pointer transition-colors ${
                        selectedWorkflow?.id === workflow.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-sm">{workflow.name}</h3>
                              <Badge 
                                variant={workflow.enabled ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {workflow.enabled ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {workflow.description}
                            </p>
                            
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                              <span className="flex items-center space-x-1">
                                <GitBranch className="w-3 h-3" />
                                <span>{workflow.rules.length} regras</span>
                              </span>
                              
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{workflow.schedule.type}</span>
                              </span>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => executeWorkflow(workflow)}>
                                <Play className="w-4 h-4 mr-2" />
                                Executar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedWorkflow(workflow);
                                setIsEditing(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateWorkflow(workflow)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteWorkflow(workflow.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {workflows.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">Nenhum workflow criado</p>
                      <p className="text-xs">Clique em "Novo Workflow" para começar</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="executions" className="flex-1">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {executions.map(execution => {
                    const workflow = workflows.find(w => w.id === execution.workflowId);
                    
                    return (
                      <Card key={execution.id} className="cursor-pointer hover:bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <div className={getStatusColor(execution.status)}>
                                  {getStatusIcon(execution.status)}
                                </div>
                                <h3 className="font-medium text-sm">
                                  {workflow?.name || 'Workflow Desconhecido'}
                                </h3>
                              </div>
                              
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                  <span>Progresso</span>
                                  <span>{execution.progress}%</span>
                                </div>
                                <Progress value={execution.progress} className="h-1" />
                              </div>
                              
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                <span>{execution.startTime.toLocaleTimeString()}</span>
                                {execution.endTime && (
                                  <span>
                                    Duração: {Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000)}s
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setShowExecutionLogs(true)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {executions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Timer className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">Nenhuma execução registrada</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Workflow Editor */}
        <div className="flex-1 flex flex-col">
          {selectedWorkflow ? (
            <>
              {/* Workflow Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedWorkflow.name}</h3>
                    <p className="text-sm text-gray-500">{selectedWorkflow.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedWorkflow.enabled}
                      onCheckedChange={(enabled) => updateWorkflow(selectedWorkflow.id, { enabled })}
                    />
                    <Label className="text-sm">Ativo</Label>
                    
                    <Button
                      size="sm"
                      onClick={() => executeWorkflow(selectedWorkflow)}
                      disabled={!selectedWorkflow.enabled}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Executar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Rules List */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Regras de Automação</h4>
                    <Button size="sm" onClick={addRule}>
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Regra
                    </Button>
                  </div>
                  
                  {selectedWorkflow.rules.map((rule, index) => (
                    <Card key={rule.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">#{rule.priority}</Badge>
                            <CardTitle className="text-sm">{rule.name}</CardTitle>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(enabled) => updateRule(rule.id, { enabled })}
                            />
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => deleteRule(rule.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Conditions */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Condições</Label>
                            <Button size="sm" variant="outline" onClick={() => addCondition(rule.id)}>
                              <Plus className="w-3 h-3 mr-1" />
                              Condição
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {rule.conditions.map((condition, condIndex) => (
                              <div key={condIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                <Select value={condition.type}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="content_type">Tipo de Conteúdo</SelectItem>
                                    <SelectItem value="file_size">Tamanho do Arquivo</SelectItem>
                                    <SelectItem value="duration">Duração</SelectItem>
                                    <SelectItem value="resolution">Resolução</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Select value={condition.operator}>
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">Igual</SelectItem>
                                    <SelectItem value="not_equals">Diferente</SelectItem>
                                    <SelectItem value="greater_than">Maior que</SelectItem>
                                    <SelectItem value="less_than">Menor que</SelectItem>
                                    <SelectItem value="contains">Contém</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Input 
                                  value={condition.value}
                                  placeholder="Valor"
                                  className="flex-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Ações</Label>
                            <Button size="sm" variant="outline" onClick={() => addAction(rule.id)}>
                              <Plus className="w-3 h-3 mr-1" />
                              Ação
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {rule.actions.map((action, actionIndex) => (
                              <div key={actionIndex} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                                <Select value={action.type}>
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="apply_template">Aplicar Template</SelectItem>
                                    <SelectItem value="add_effect">Adicionar Efeito</SelectItem>
                                    <SelectItem value="export_video">Exportar Vídeo</SelectItem>
                                    <SelectItem value="send_notification">Enviar Notificação</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Input 
                                  placeholder="Parâmetros (JSON)"
                                  className="flex-1"
                                  defaultValue={JSON.stringify(action.parameters)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {selectedWorkflow.rules.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">Nenhuma regra configurada</p>
                      <p className="text-xs">Adicione regras para automatizar ações</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Selecione um workflow</p>
                <p className="text-sm">Escolha um workflow da lista para visualizar e editar</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Workflow Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Workflow</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do workflow"
              />
            </div>
            
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do workflow"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={workflowForm.enabled}
                onCheckedChange={(enabled) => setWorkflowForm(prev => ({ ...prev, enabled }))}
              />
              <Label>Ativar workflow</Label>
            </div>
            
            <div>
              <Label>Tipo de Agendamento</Label>
              <Select
                value={workflowForm.schedule.type}
                onValueChange={(type: any) => setWorkflowForm(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, type }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="interval">Intervalo</SelectItem>
                  <SelectItem value="cron">Cron</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={createWorkflow}>
                Criar Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationWorkflows;